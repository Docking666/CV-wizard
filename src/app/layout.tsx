export const metadata = {
  title: "AI 简历岗位适配器",
  description: "AI 驱动的简历适配系统",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
