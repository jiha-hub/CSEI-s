/**
 * CSEI-s (Core Seven Emotions Inventory - short form)
 * 진단 엔진 및 규준 데이터
 */

export type Gender = 'male' | 'female';
export type AgeGroup = '20s' | '30s' | '40s' | '50s_plus';

export interface NormData {
  mean: number;
  sd: number;
}

export type EmotionFactor = 'JOY' | 'ANGER' | 'THOUGHT' | 'DEPRESSION' | 'SORROW' | 'FRIGHT' | 'FEAR' | 'TOTAL';

export interface FactorResult {
  factor: EmotionFactor;
  name: string;
  rawScore: number;
  zScore: number;
  tScore: number;
  group: 'normal' | 'caution' | 'risk';
  groupLabel: string;
}

// --- 성별/연령별 규준 데이터 (M, SD) ---
export const NORMS: Record<AgeGroup, Record<Gender, Record<EmotionFactor, NormData>>> = {
  '20s': {
    male: {
      JOY: { mean: 10, sd: 3 },
      ANGER: { mean: 8, sd: 3 },
      THOUGHT: { mean: 13, sd: 4 },
      DEPRESSION: { mean: 10, sd: 4 },
      SORROW: { mean: 10, sd: 4 },
      FRIGHT: { mean: 11, sd: 4 },
      FEAR: { mean: 9, sd: 4 },
      TOTAL: { mean: 72, sd: 18 },
    },
    female: {
      JOY: { mean: 11, sd: 4 },
      ANGER: { mean: 9, sd: 4 },
      THOUGHT: { mean: 14, sd: 4 },
      DEPRESSION: { mean: 10, sd: 4 },
      SORROW: { mean: 11, sd: 4 },
      FRIGHT: { mean: 11, sd: 4 },
      FEAR: { mean: 11, sd: 4 },
      TOTAL: { mean: 76, sd: 18 },
    }
  },
  '30s': {
    male: {
      JOY: { mean: 11, sd: 3 },
      ANGER: { mean: 9, sd: 4 },
      THOUGHT: { mean: 13, sd: 4 },
      DEPRESSION: { mean: 10, sd: 4 },
      SORROW: { mean: 10, sd: 4 },
      FRIGHT: { mean: 10, sd: 4 },
      FEAR: { mean: 9, sd: 3 },
      TOTAL: { mean: 71, sd: 18 },
    },
    female: {
      JOY: { mean: 10, sd: 3 },
      ANGER: { mean: 9, sd: 4 },
      THOUGHT: { mean: 13, sd: 4 },
      DEPRESSION: { mean: 10, sd: 4 },
      SORROW: { mean: 11, sd: 4 },
      FRIGHT: { mean: 11, sd: 4 },
      FEAR: { mean: 10, sd: 4 },
      TOTAL: { mean: 75, sd: 18 },
    }
  },
  '40s': {
    male: {
      JOY: { mean: 11, sd: 3 },
      ANGER: { mean: 9, sd: 3 },
      THOUGHT: { mean: 12, sd: 4 },
      DEPRESSION: { mean: 9, sd: 4 },
      SORROW: { mean: 10, sd: 4 },
      FRIGHT: { mean: 10, sd: 3 },
      FEAR: { mean: 8, sd: 4 },
      TOTAL: { mean: 67, sd: 18 },
    },
    female: {
      JOY: { mean: 10, sd: 3 },
      ANGER: { mean: 8, sd: 3 },
      THOUGHT: { mean: 12, sd: 4 },
      DEPRESSION: { mean: 9, sd: 4 },
      SORROW: { mean: 10, sd: 4 },
      FRIGHT: { mean: 10, sd: 4 },
      FEAR: { mean: 9, sd: 4 },
      TOTAL: { mean: 68, sd: 17 },
    }
  },
  '50s_plus': {
    male: {
      JOY: { mean: 10, sd: 3 },
      ANGER: { mean: 8, sd: 3 },
      THOUGHT: { mean: 11, sd: 4 },
      DEPRESSION: { mean: 8, sd: 4 },
      SORROW: { mean: 9, sd: 4 },
      FRIGHT: { mean: 9, sd: 4 },
      FEAR: { mean: 7, sd: 4 },
      TOTAL: { mean: 61, sd: 18 },
    },
    female: {
      JOY: { mean: 10, sd: 3 },
      ANGER: { mean: 7, sd: 3 },
      THOUGHT: { mean: 10, sd: 4 },
      DEPRESSION: { mean: 8, sd: 4 },
      SORROW: { mean: 9, sd: 4 },
      FRIGHT: { mean: 9, sd: 4 },
      FEAR: { mean: 8, sd: 4 },
      TOTAL: { mean: 62, sd: 18 },
    }
  }
};

// 한글 매핑
export const FACTOR_NAMES: Record<EmotionFactor, string> = {
  JOY: '기쁨',
  ANGER: '분노',
  THOUGHT: '고민',
  DEPRESSION: '근심',
  SORROW: '슬픔',
  FRIGHT: '두려움',
  FEAR: '놀람',
  TOTAL: '전체 지표',
};

/**
 * T-점수 기반 군 분류 판정
 * 정상: 40 < T < 60
 * 주의: 30 <= T <= 40 또는 60 <= T <= 70
 * 위험: T < 30 또는 T > 70
 */
export function classifyGroup(tScore: number): { group: 'normal' | 'caution' | 'risk', label: string } {
  if (tScore < 30 || tScore > 70) {
    return { group: 'risk', label: '위험군' };
  } else if ((tScore >= 30 && tScore <= 40) || (tScore >= 60 && tScore <= 70)) {
    return { group: 'caution', label: '주의군' };
  } else {
    return { group: 'normal', label: '정상군' };
  }
}

/**
 * 진단 분석 실행 함수
 */
export function analyzeResults(
  answers: Record<number, number>,
  gender: Gender,
  ageGroup: AgeGroup
): { factors: FactorResult[], overall: FactorResult } {
  
  const normSet = NORMS[ageGroup]?.[gender] || NORMS['20s'][gender];

  const factors: EmotionFactor[] = ['JOY', 'ANGER', 'THOUGHT', 'DEPRESSION', 'SORROW', 'FRIGHT', 'FEAR'];
  
  const factorResults = factors.map((factor, idx) => {
    let rawScore = 0;
    for (let i = 0; i < 4; i++) {
      const qIdx = idx + (i * 7);
      rawScore += (answers[qIdx] || 0);
    }

    const { mean, sd } = normSet[factor];
    const zScore = (rawScore - mean) / sd;
    const tScore = Math.round(50 + (10 * zScore));
    const { group, label } = classifyGroup(tScore);

    return {
      factor,
      name: FACTOR_NAMES[factor],
      rawScore,
      zScore: Number(zScore.toFixed(2)),
      tScore,
      group,
      groupLabel: label
    };
  });

  const totalRaw = factorResults.reduce((acc, curr) => acc + curr.rawScore, 0);
  const totalNorm = normSet['TOTAL'];
  const totalZ = (totalRaw - totalNorm.mean) / totalNorm.sd;
  const totalT = Math.round(50 + (10 * totalZ));
  const totalClassification = classifyGroup(totalT);

  const overall: FactorResult = {
    factor: 'TOTAL',
    name: FACTOR_NAMES['TOTAL'],
    rawScore: totalRaw,
    zScore: Number(totalZ.toFixed(2)),
    tScore: totalT,
    group: totalClassification.group,
    groupLabel: totalClassification.label
  };

  return { factors: factorResults, overall };
}
