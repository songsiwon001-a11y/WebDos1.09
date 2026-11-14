// WEB-DOS: EmulatorJS 파일(cdn.emulatorjs.org)을 브라우저 Cache Storage 에 보관해서 다음부터는 다운로드 없이 쓴다.
// 이 파일은 webdos.html 과 같은 폴더에 두고, https(또는 localhost)로 열어야 동작한다.
const CACHE = 'webdos-emu-v1';
const HOST = 'cdn.emulatorjs.org';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        for (const k of await caches.keys()) if (k.startsWith('webdos-emu-') && k !== CACHE) await caches.delete(k);
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', e => {
    const r = e.request;
    if (r.method !== 'GET' || r.headers.has('range')) return;
    const u = new URL(r.url);
    if (u.hostname !== HOST) return;
    e.respondWith((async () => {
        const c = await caches.open(CACHE);
        const hit = await c.match(u.href);
        if (hit) return hit;
        let res;
        // <script>/<link> 같은 no-cors 요청도 CORS 응답으로 받아 두면 용량 계산이 정확하고, COEP 환경에서도 문제가 없다.
        try { res = await fetch(u.href, { mode: 'cors', credentials: 'omit' }); }
        catch (err) { res = await fetch(r); }
        if (res && res.status === 200) { try { await c.put(u.href, res.clone()); } catch (err) {} }
        return res;
    })());
});
