const CACHE_NAME = "family-quest-shell-v1";

// 앱 화면 자체는 항상 인터넷의 최신 버전을 먼저 확인합니다.
// 인터넷이 안 될 때만 기존 캐시를 사용합니다.
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  // 새 서비스워커를 대기 상태에 두지 않고 즉시 활성화
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      // 예전 캐시 삭제
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      // 열려 있는 페이지를 새 서비스워커가 즉시 제어
      self.clients.claim()
    ])
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase, jsDelivr 같은 외부 요청은 서비스워커가 건드리지 않음
  if (url.origin !== self.location.origin) return;

  // 페이지 이동 및 index.html:
  // 네트워크 최신본 우선, 실패할 때만 캐시 사용
  if (request.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached =>
            cached || caches.match("./index.html")
          )
        )
    );
    return;
  }

  // manifest 등 정적 파일도 최신본 우선
  event.respondWith(
    fetch(request, { cache: "no-store" })
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
