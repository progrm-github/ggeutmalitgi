// Service Worker のバージョンとキャッシュする App Shell を定義する
const CACHE_NAME = `Naotiki-Apps_Wiki-Shiritori_Version-0.3`
const urlsToCache = [
  './index.html',
  './siritori.js',
  './chat_UI.css',
  './jquery-3.4.1.min.js',
  './icons/human_icon.png',
  './icons/Wikipedia-logo-v2-ja.png',
  './font_icon/css/all.min.css',
  './font_icon/webfonts/fa-regular-400.eot',
  './font_icon/webfonts/fa-regular-400.svg',
  './font_icon/webfonts/fa-regular-400.ttf',
  './font_icon/webfonts/fa-regular-400.woff',
  './font_icon/webfonts/fa-regular-400.woff2',
  './font_icon/webfonts/fa-solid-900.eot',
  './font_icon/webfonts/fa-solid-900.svg',
  './font_icon/webfonts/fa-solid-900.ttf',
  './font_icon/webfonts/fa-solid-900.woff',
  './font_icon/webfonts/fa-solid-900.woff2'
];
const CACHE_KEYS = [
  CACHE_NAME
];
self.addEventListener('install', function(event) {
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(
          function(cache){
              return cache.addAll(urlsToCache);
          })
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          return !CACHE_KEYS.includes(key);
        }).map(key => {
          // 不要なキャッシュを削除
          return caches.delete(key);
        })
      );
    })
  );
});
self.addEventListener('fetch', function(event) {
  //ブラウザが回線に接続しているかをboolで返してくれる
  var online = navigator.onLine;

  //回線が使えるときの処理
  if(online){
    event.respondWith(
      caches.match(event.request)
        .then(
        function (response) {
          if (response) {
            return response;
          }
          //ローカルにキャッシュがあればすぐ返して終わりですが、
          //無かった場合はここで新しく取得します
          return fetch(event.request)
            .then(function(response){
              // 取得できたリソースは表示にも使うが、キャッシュにも追加しておきます
              // ただし、Responseはストリームなのでキャッシュのために使用してしまうと、ブラウザの表示で不具合が起こる(っぽい)ので、複製しましょう
              cloneResponse = response.clone();
              if(response){
                //ここ&&に修正するかもです
                if(response || response.status == 200){
                  //現行のキャッシュに追加
                  caches.open(CACHE_NAME)
                    .then(function(cache)
                    {
                      cache.put(event.request, cloneResponse)
                      .then(function(){
                        //正常にキャッシュ追加できたときの処理(必要であれば)
                      });
                    });
                }else{
                  //正常に取得できなかったときにハンドリングしてもよい
                  return response;
                }
                return response;
              }
            }).catch(function(error) {
              //デバッグ用
              return console.log(error);
            });
        })
    );
  }else{
    //オフラインのときの制御
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // キャッシュがあったのでそのレスポンスを返す
          if (response) {
            return response;
          }
          //オフラインでキャッシュもなかったパターン
          return caches.match("index.html")
              .then(function(responseNodata)
              {
                //適当な変数にオフラインのときに渡すリソースを入れて返却
                //今回はoffline.htmlを返しています
                return responseNodata;
              });
        }
      )
    );
  }
});
