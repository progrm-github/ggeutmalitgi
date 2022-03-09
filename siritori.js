"use strict";
//PWA Start
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./serviceWorker.js")
        .then(
            function (registration) {
                registration.onupdatefound = function() {
                    console.log('アップデートがあります！');
                    registration.update();
                }
            })
        .catch(function (error) {
            console.log("Error Log: " + error);
        });
}

if (navigator.onLine) {
    //オンライン
} else {
    //オフライン
    const reload = confirm("인터넷에 접속해 주십시오.\n다시 읽어 들이겠습니까?");
    if (reload) {
        location.reload(true);
    } else {
        window.addEventListener("online", (e) => {
            location.reload(true)
        })
        alert("인터넷에 연결되지 않으면 끝말잇기를 진행할 수 없습니다.");
    }
}
window.addEventListener("offline", (e) => {
    //オフライン
    const reload = confirm("인터넷에 접속해 주십시오.\n다시 읽어 들이겠습니까?");
    if (reload) {
        location.reload(true);
    } else {
        window.addEventListener("online", (e) => {
            location.reload(true)
        })
        alert("인터넷에 연결되지 않으면 끝말잇기를 진행할 수 없습니다.");
    }
})
//PWA End

//音声認識/合成の準備
const obj = document.getElementById("chat-box");
const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
let speech;
const msg = new SpeechSynthesisUtterance();
msg.lang = "ko-KR"; //言語

let words = [];
let wikiPageId = [];
let Word_history = [
    {
        word: "끝말잇기",
        pageId: "20287"
    }
];
let cpu_word = "";
let next_word = "기";
let IsWork = false;
const switchButton = $("#check");
const recordButton = $("#record_btn");
const recordButtonText = $("#record_btn_text");
const submitButton = $("#submit_btn");
const submitButtonText = $("#submit_btn_text");
const inputText = $("#input_text");
const chatBox = $("#chat-box");
const wikiURL = "https://ko.wikipedia.org/?curid="
if (SpeechRecognition !== undefined) {
    // ユーザのブラウザは音声認識に対応しています。
    speech = new SpeechRecognition();
    speech.lang = "ko-KR";
    speech.interimResults = true;
    recordButton.click(function () {
        // 音声認識をスタート
        if (!IsWork) {
            IsWork = true;
            recordButton.prop("disabled", true);
            submitButton.prop("disabled", true);
            recordButtonText.text("마이크로 녹음중");
            recordButton.css("background-color", "#ff0000");
            speech.start();
        }
    });
    speech.onnomatch = function () {
        console.log("인식하지 못했습니다.");
        say("인식하지 못했습니다.", chatBox)
        ResetUI();
        IsWork = false;
        inputText.attr("readonly", false);
    };
    speech.onerror = function () {
        console.log("인식하지 못했습니다.");
        say("인식하지 못했습니다.", chatBox)
        ResetUI();
        IsWork = false;
        inputText.attr("readonly", false);
    };
    //音声自動文字起こし機能
    speech.onresult = function (e) {
        if (!e.results[0].isFinal) {
            const speechtext = e.results[0][0].transcript;
            console.log(speechtext)
            inputText.attr("readonly", true);
            inputText.val(speechtext);
            return;
        }

        recordButtonText.text("처리중");
        submitButtonText.text("처리중");
        submitButton.css("background-color", "#999999");
        recordButton.css("background-color", "#999999");
        console.log("result")
        speech.stop();

        if (e.results[0].isFinal) {
            console.log("성공！")
            const autotext = e.results[0][0].transcript;
            console.log(e);
            console.log(autotext);//autotextが結果
            inputText.val(autotext);
            Submit(autotext)
        }
    }
} else {
    recordButton.click(function () {
        alert("이 브라우저는 음성인식에 대응하지 않습니다.")
    })
    recordButton.prop("disabled", true);
    recordButtonText.text("비대응")
}

function Submit(text) {
    recordButton.prop("disabled", true);
    recordButtonText.text("처리중");
    submitButton.prop("disabled", true);
    submitButtonText.text("처리중");
    console.log("リザルト")
    console.log(text);//textが結果
    //ここから返答処理
    say_human(text)
    obj.scrollTop = obj.scrollHeight;
    //処理が終わったら考え中の文字を削除し、結果を入れる
    if (next_word !== str_change(text, 1)[0]) {
        say("「" + next_word + "」로 이어줘！", chatBox);
        ResetUI();

    } else if (IsUsedWord(text)) {
        say("「" + text + "」은(는), 이미 사용된 단어입니다！", chatBox);
        ResetUI();

    } else {
        Word_history.push({
            word: text,
            pageId: undefined
        });
        siritori(text).then(function (values) {
            let value = values[0];
            let link = wikiURL + values[1];
            // 非同期処理成功
            console.log(value);
            next_word = str_change(value, -1)[0]
            inputText.attr("placeholder", "「" + next_word + "」로 시작하는 말");

            say("「" + value + "」", chatBox, link)
            Word_history.push(
                {
                    word: value,
                    pageId: values[1]
                }
            );
            obj.scrollTop = obj.scrollHeight;

            if (switchButton.checked) {
                msg.text = value;
                speechSynthesis.speak(msg);
            }
            CreateSaveData()
            console.log("処理終了");
            ResetUI();
        }).catch(function (error) {
            // 非同期処理失敗。呼ばれない
            alert("error:Wikipedia api\n" + error)
            console.log(error);
            say("에러가 발생했습니다.", chatBox);
            ResetUI();
        }).finally(function () {
            IsWork = false;
        });
    }
}

$(function () {
    $(window).keydown(function (e) {
        if (e.altKey) {
            if (e.keyCode === 13) {
                SubmitButtonClick();
            }
            return false;
        }
    });

        say("「끝말잇기」", chatBox, "https://ko.wikipedia.org/wiki/%EB%81%9D%EB%A7%90%EC%9E%87%EA%B8%B0");


})


function SubmitButtonClick() {
    submitButton.css("background-color", "#999999");
    recordButton.css("background-color", "#999999");
    const text = inputText.val();
    if (text === "") {
        ResetUI();
        return; //何もないなら関数を終了させる
    }
    Submit(text);

}

function ResetUI() {
    inputText.val("");
    recordButton.prop("disabled", false);
    submitButton.prop("disabled", false);
    recordButtonText.text("마이크");
    submitButtonText.text("전송");
    recordButton.css("background-color", "#00bcd4");
    submitButton.css("background-color", "#00bcd4");
}

submitButton.click(SubmitButtonClick)
const dbName = "wiki_siritori_history";

function CreateSaveData() {
    let data = {
        next_word: next_word,
        used_words: Word_history,
    }
    console.log(data)
    localStorage.setItem(dbName, JSON.stringify(data));
}

function ParseSaveData() {
    let data = JSON.parse(localStorage.getItem(dbName))
    $("#parent").empty();
    next_word = data.next_word
    inputText.attr("placeholder", "「" + next_word + "」로 시작하는 말");
    Word_history = data.used_words
    Word_history.forEach(word => {
        if (word.pageId === undefined) {
            say_human(word.word)
        } else {
            say(`「${word.word}」`, chatBox, wikiURL + word.pageId)
        }
    })
}

/***
 * @return 前に使用されていればtrue、なければfalse
 ***/
function IsUsedWord(text) {
    return Word_history.filter(function (value) {
        return value.word === text
    }).length > 0
}

function siritori(user_msg) {
    return new Promise(function (resolve, reject) {
        words = [];
        wikiPageId = [];
        const chenges = str_change(user_msg, -1);
        const taskA = new Promise(function (resolve) {
            WikipediaAPI(chenges[0], resolve);
        });
        const taskB = new Promise(function (resolve) {
            WikipediaAPI(chenges[1], resolve);
        });
        Promise.all([taskA, taskB]).then(function () {
            console.log(words);
            if (words === []) {
                say("치명적인 오류:졌습니다.", chatBox);
                console.error("強すぎException")
                return;
            }
            let random = Math.floor(Math.random() * words.length);
            cpu_word = words[random];
            let wikiLink = wikiPageId[random];
            if (str_change(cpu_word, -1)[0] === "ん") {
                do {
                    words.splice(words.indexOf(cpu_word), words.indexOf(cpu_word))
                    random = Math.floor(Math.random() * words.length);
                    cpu_word = words[random];
                    wikiLink = wikiPageId[random];
                } while (str_change(cpu_word, -1)[0] === "ん")
                resolve([cpu_word, wikiLink]);

            } else {
                resolve([cpu_word, wikiLink]);
            }


        })
    });
}

function WikipediaAPI(query, end) {
    //API呼び出し
    console.log(query);
    $.ajax({
        type: "GET",
        timeout: 10000,
        dataType: "jsonp",
        url: "https://ko.wikipedia.org/w/api.php?format=json&action=query&list=prefixsearch&pssearch=" + query + "&pslimit=200&psnamespace=0",
        async: false,
        success: function (json) {
            console.log(json)
            json.query.prefixsearch.forEach(function (value) {
                if (value.title !== query) {
                    let word = value.title;
                    word = word.replace(/ *\([^)]*\) */g, "");
                    if (!IsUsedWord(word)) {
                        words.push(word);
                        wikiPageId.push(value.pageid.toString());
                    }
                }
            });
            end();
        }
    });

}

//正規表現
const regex = /(?!\p{Lm})\p{L}|\p{N}/u;

/**
 * 引数ran
 1 先頭切り出し
 -1 末尾切り出し
 **/
function str_change(str, ran) {
    let range = ran;
    if (range === 1) {
        range = [0, 1]
    } else {
        range = [-1, undefined]
    }
    const hiragana = ["あ", "い", "う", "え", "お",
        "か", "き", "く", "け", "こ",
        "さ", "し", "す", "せ", "そ",
        "た", "ち", "つ", "て", "と",
        "な", "に", "ぬ", "ね", "の",
        "は", "ひ", "ふ", "へ", "ほ",
        "ま", "み", "む", "め", "も",
        "や", "ゆ", "よ",
        "わ", "を", "ん",
        "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
        "っ",
        "ゃ", "ゅ", "ょ",
        "が", "ぎ", "ぐ", "げ", "ご",
        "ざ", "じ", "ず", "ぜ", "ぞ",
        "だ", "ぢ", "づ", "で", "ど",
        "ば", "び", "ぶ", "べ", "ぼ",
    ]
    const katakana = ["ア", "イ", "ウ", "エ", "オ",
        "カ", "キ", "ク", "ケ", "コ",
        "サ", "シ", "ス", "セ", "ソ",
        "タ", "チ", "ツ", "テ", "ト",
        "ナ", "ニ", "ヌ", "ネ", "ノ",
        "ハ", "ヒ", "フ", "ヘ", "ホ",
        "マ", "ミ", "ム", "メ", "モ",
        "ヤ", "ユ", "ヨ",
        "ワ", "ヲ", "ン",
        "ァ", "ィ", "ゥ", "ェ", "ォ",
        "ッ",
        "ャ", "ュ", "ョ",
        "ガ", "ギ", "グ", "ゲ", "ゴ",
        "ザ", "ジ", "ズ", "ゼ", "ゾ",
        "ダ", "ヂ", "ヅ", "デ", "ド",
        "バ", "ビ", "ブ", "ベ", "ボ",]
    let r = [];
    let word = str;

    //끝말잇기処理除外対象が二回連続でも対応

    //const del_str =func_str.slice(range[0], range[1]) != "ー" && func_str.slice(range[0], range[1]) != "-" && func_str.slice(range[0], range[1]) != "!" && func_str.slice(range[0], range[1]) != "?" && func_str.slice(range[0], range[1]) != "！" && func_str.slice(range[0], range[1]) != "？" && func_str.slice(range[0], range[1]) != "〜" && func_str.slice(range[0], range[1]) != "、"&&func_str.slice(range[0], range[1]) != "。"&&func_str.slice(range[0], range[1]) != "."


    if (hiragana.indexOf(word.slice(range[0], range[1])) !== -1) {//ひらがな
        r.push(word.slice(range[0], range[1]));
        r.push(katakana[hiragana.indexOf(word.slice(range[0], range[1]))]);
        console.log(r)
    } else if (katakana.indexOf(str.slice(range[0], range[1])) !== -1) {//カタカナ
        r.push(hiragana[katakana.indexOf(word.slice(range[0], range[1]))]);
        r.push(word.slice(range[0], range[1]));
        console.log(r)
    } else {//漢字
        $.ajax({
            type: "POST",
            timeout: 10000,
            url: "https://labs.goo.ne.jp/api/hiragana",
            async: false,
            "headers": {
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                "app_id": "7e6a1cf050d53f86f5530bc2c222c6084e888fadacfb14b0c5617bcf091975d1",
                "sentence": word,
                "output_type": "hiragana"
            }),
        }).done(function (data) {
            word = data.converted;
            if (range[0] === -1) {
                if (!regex.test(word.slice(-1))) {
                    do {
                        word = word.slice(0, word.length - 1)
                    } while (!regex.test(word.slice(-1)))
                    word = word.slice(-1)
                } else {
                    word = word.slice(-1);
                }
            }

            r.push(word.slice(range[0], range[1]));// ひらがなを rに追加
            r.push(katakana[hiragana.indexOf(word.slice(range[0], range[1]))]);//カタカナをr に追加
            console.log(r)
        });
    }
    switch (r[0]) {//小文字変換　ひらがな　もっといい方法あるかな？
        case "ぁ":
            r[0] = "あ";
            break;
        case "ぃ":
            r[0] = "い";
            break;
        case "ぅ":
            r[0] = "う";
            break;
        case "ぇ":
            r[0] = "え";
            break;
        case "ぉ":
            r[0] = "お";
            break;
        case "っ":
            r[0] = "つ";
            break;
        case "ゃ":
            r[0] = "や";
            break;
        case "ゅ":
            r[0] = "ゆ";
            break;
        case "ょ":
            r[0] = "よ";
            break;
        case "ゎ":
            r[0] = "わ";
            break;
        case "を":
            r[0] = "お";
    }
    switch (r[1]) {//小文字変換　カタカナ
        case "ァ":
            r[1] = "ア";
            break;
        case "ィ":
            r[1] = "イ";
            break;
        case "ゥ":
            r[1] = "ウ";
            break;
        case "ェ":
            r[1] = "エ";
            break;
        case "ォ":
            r[1] = "オ";
            break;
        case "ヵ":
            r[1] = "カ";
            break;
        case "ヶ":
            r[1] = "ケ";
            break;
        case "ッ":
            r[1] = "ツ";
            break;
        case "ャ":
            r[1] = "ヤ";
            break;
        case "ュ":
            r[1] = "ユ";
            break;
        case "ョ":
            r[1] = "ヨ";
            break;
        case "ヮ":
            r[1] = "ワ";
            break;
        case "ヲ":
            r[1] = "オ";
    }
    console.log(r);
    return r;
}

function say(text, element, link) {// Sayする関数\
    console.log(text);
    if (text == "「Undefined」") {
        alert("승리하셨습니다.");
        window.location.reload();
    }
    if (text == "「Undefined Fantastic Object」") {
        alert("승리하셨습니다.");
        window.location.reload();
    }
    if (link === undefined) {
        element.html(`${element.html()}<div class="kaiwa"><figure class="kaiwa-img-left"><img src="./icons/Wikipedia-logo-v2-ja.png" alt="no-img2"><figcaption class="kaiwa-img-description">끝말잇기 AI</figcaption></figure><div class="kaiwa-text-right"><p class="kaiwa-text">존재하지 않는 단어입니다.</p></div></div>`)
    } else {
        element.html(`${element.html()}<div class="kaiwa"><figure class="kaiwa-img-left"><img src="./icons/Wikipedia-logo-v2-ja.png" alt="no-img2"><figcaption class="kaiwa-img-description">끝말잇기 AI</figcaption></figure><div class="kaiwa-text-right"><p class="kaiwa-text"><a href="${link}" target="_blank" rel="noopener noreferrer">${text}</a></p></div></div>`)
    }
    obj.scrollTop = obj.scrollHeight;
}

function say_human(text) {
    chatBox.html(`${chatBox.html()}<div class="kaiwa"><!–右からの吹き出し–><figure class="kaiwa-img-right"><img src="./icons/human_icon.png" alt="no-img2"><figcaption class="kaiwa-img-description">당신</figcaption></figure><div class="kaiwa-text-left"><p class="kaiwa-text">「${text}」</p></div></div><!–右からの吹き出し 終了–>`);
}
