import { NextResponse } from 'next/server'
import { PineconeStore } from '@langchain/pinecone'
import { PineconeEmbeddings } from '@langchain/pinecone'
import { Document } from '@langchain/core/documents'
import fs from 'fs'
import path from 'path'
import { getPineconeClient, PINECONE_INDEX_NAME } from '@/utils/pinecone_client'

// CSV 파서 (따옴표 안의 쉼표 처리)
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter(line => line.trim() !== '')
  if (lines.length < 2) return []

  const parseRow = (row: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') { current += '"'; i++ }
        else { inQuotes = !inQuotes }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim()); current = ''
      } else { current += char }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const values = parseRow(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h.trim()] = values[i] ?? '' })
    return row
  }).filter(row => Object.values(row).some(v => v !== ''))
}

export async function POST() {
  try {
    // 1. CSV 파일 읽기
    const csvPath = path.join(process.cwd(), 'samples', 'reframing_dataset.csv')
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`)
    }

    const csvData = fs.readFileSync(csvPath, 'utf8')
    const rows = parseCSV(csvData)

    console.log(`파싱된 행 수: ${rows.length}`)
    if (rows.length === 0) throw new Error('CSV 데이터가 비어 있습니다.')

    // 2. LangChain Document 변환
    const documents = rows.map((row, index) => {
      const text = `상황: ${row.situation}\n생각: ${row.thought}`
      return new Document({
        pageContent: text,
        metadata: {
          reframe: row.reframe || '',
          traps: row.thinking_traps_addressed || '',
          source: 'reframing_dataset.csv',
          original_index: index,
        },
      })
    })

    // 3. Pinecone 클라이언트 및 인덱스
    const pc = getPineconeClient()
    const pineconeIndex = pc.Index(PINECONE_INDEX_NAME)

    // 4. LangChain PineconeEmbeddings (llama-text-embed-v2)
    const embeddings = new PineconeEmbeddings({
      model: 'llama-text-embed-v2',
      apiKey: process.env.PINECONE_API_KEY!,
    })

    // 5. 배치 업로드 (50개씩)
    const BATCH_SIZE = 50
    let uploaded = 0

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE)
      await PineconeStore.fromDocuments(batch, embeddings, {
        pineconeIndex,
        namespace: 'main',
      })
      uploaded += batch.length
      console.log(`업로드 진행: ${uploaded}/${documents.length}`)
    }

    return NextResponse.json({
      success: true,
      message: `${documents.length}개의 데이터가 'main' 네임스페이스에 성공적으로 업로드되었습니다.`,
    })
  } catch (error: any) {
    console.error('인덱싱 실패 상세:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
