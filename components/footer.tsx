import Link from "next/link"

const COPYRIGHT =
  "All rights reserved. No part of this publication may be reproduced in any manner without the prior written permission from the copyright holders. © 2026 무수이 musui"

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-black/10 bg-white">
      <div className="mx-auto flex max-w-[480px] items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center" aria-label="musui 홈">
          {/* 트림된 로고(아이콘+Musui 텍스트) — v3 캐시 버스팅, img로 그대로 표시 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-footer-v3.png"
            alt="Musui"
            className="h-7 w-auto object-contain"
          />
        </Link>
        <p className="max-w-[260px] text-xs leading-snug text-black/60">
          {COPYRIGHT}
        </p>
      </div>
    </footer>
  )
}
