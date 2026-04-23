import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import ResumeBanner from "./components/ResumeBanner";

export const metadata: Metadata = {
  title: "MoodB | 스마트 7가지 감정 정서 진단 서비스",
  description: "28문항 핵심 감정 척도 분석와 명상 알고리즘을 통한 데이터 기반 마음 건강 파트너",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col pt-20">
        <Navbar />
        {children}
        <ResumeBanner />
      </body>
    </html>
  );
}
