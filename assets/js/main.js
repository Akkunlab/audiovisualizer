(function () {

    /* 設定 */
    const config = {

        types: {
            type: 'Bar',
            typeList: ['Bar', 'Line', 'Circle'],
            typeCount: 0,
        },

        audio: {
            gain: 0.5,
            fftSize: 2048,
            barfftSize: 128, 
        },

        canvas: {
            width: window.innerWidth,
            height:	window.innerHeight - 60,
            lineWidth: 3,
            circleWidth: 15,
            circlebars: 50,
            circleRadius: 180,
            color: '#000',
            random() {
                return `rgb(
                    ${Math.floor(Math.random() * 220 + 36)},
                    ${Math.floor(Math.random() * 220 + 36)},
                    ${Math.floor(Math.random() * 220 + 36)}
                )`;
            }
        }

    }

    /* 初期化 */
    let canvas, canvasCtx, source;
    const audioCtx = new AudioContext();
    const gainNode = audioCtx.createGain();
    const analyser = audioCtx.createAnalyser();

    /* Canvas設定 */
    const init = () => {
        canvas = document.getElementById('canvas');
        canvas.width = config.canvas.width;
        canvas.height = config.canvas.height;
        canvasCtx = canvas.getContext('2d');
        canvasCtx.fillStyle = config.canvas.fillStyle;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        initCanvas[config.types.type]();
    };

    /* Canvas初期化 */
    const initCanvas = {

        Bar() {  // 棒型
            analyser.fftSize = config.audio.barfftSize;
            config.canvas.color = config.canvas.random();
        },

        Line() { // 折れ線型
            analyser.fftSize = config.audio.fftSize;
            canvasCtx.strokeStyle = config.canvas.random();
        },

        Circle() { // 円型
            canvasCtx.strokeStyle = config.canvas.random();
            canvasCtx.lineWidth = config.canvas.lineWidth;
        }

    };

    /* Canvas描画 */
    const drawCanvas = {
        
        Bar() { // 棒型
            const spectrums = new Uint8Array(analyser.frequencyBinCount);
            const length = spectrums.length - 15;
            const width = canvas.width / length;
            const height = canvas.height / (3 / 2);
            analyser.getByteFrequencyData(spectrums);
        　
            canvasCtx.fillStyle = '#000';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height); // 初期化
            canvasCtx.fillStyle = config.canvas.color;

            for (let i = 1; i < length - 1; i++) {
                canvasCtx.fillRect(i * width, height, width / 2, 10);
                canvasCtx.fillRect(i * width, height, width / 2, -spectrums[i + 5] * 2);
            }
        　
            requestAnimationFrame(drawCanvas.Bar);
        },
        
        Line() { // 折れ線型
            let x, y;
            const dataArray = new Uint8Array(analyser.fftSize);
            const sliceWidth = canvas.width / analyser.fftSize;
            analyser.getByteTimeDomainData(dataArray);
    
            canvasCtx.fillStyle = '#000';
            canvasCtx.lineWidth = config.canvas.lineWidth;
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height); // 初期化
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, canvas.height / 2);
    
            for (let i = 0; i < analyser.fftSize; i++) {
                x = sliceWidth * i;
                y = (dataArray[i] / 128) * canvas.height / 2;
                canvasCtx.lineTo(x, y);
            }
    
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
            
            requestAnimationFrame(drawCanvas.Line);
        },

        Circle() { // 円型
            let rads, x1, y1, x2, y2;
            const frequency_array = new Uint8Array(analyser.frequencyBinCount);
            const x0 = canvas.width / 2;
            const y0 = canvas.height / 2;
            const r = config.canvas.circleRadius;
            const bars = config.canvas.circlebars;
            analyser.getByteFrequencyData(frequency_array);
            
            canvasCtx.fillStyle = '#000';
            canvasCtx.lineWidth = config.canvas.lineWidth;
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height); // 初期化
            canvasCtx.beginPath();
            canvasCtx.arc(x0, y0, r - 10, 0, 2 * Math.PI);
            canvasCtx.stroke();

            const drawBar = (x1, y1, x2, y2) => { // 棒描画
                canvasCtx.lineWidth = config.canvas.circleWidth;
                canvasCtx.beginPath();
                canvasCtx.moveTo(x1, y1);
                canvasCtx.lineTo(x2, y2);
                canvasCtx.stroke();
            }
            
            for (let i = 0; i < bars; i++) {
                rads = Math.PI * 2 / bars * i;
                x1 = x0 + Math.cos(rads) * r;
                y1 = y0 + Math.sin(rads) * r;
                x2 = x0 + Math.cos(rads) * (r + frequency_array[i]);
                y2 = y0 + Math.sin(rads) * (r + frequency_array[i]);
                drawBar(x1, y1, x2, y2);
            }
    
            requestAnimationFrame(drawCanvas.Circle);
        }

    };

    /* デコード */
    const decode = arrayBuffer => {
        audioCtx.decodeAudioData(arrayBuffer, audioBuffer => {
            if (source) source.stop(); // 停止
            gainNode.gain.value = config.audio.gain;
            source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNode).connect(audioCtx.destination);
            source.connect(analyser);
            source.start(); // 再生
            drawCanvas[config.types.type](); // Canvas描画
        });
    };

    /* イベント */
    
    // サンプルオーディオ読み込み
    const fetch = (url, resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = () => resolve(request.response);
        request.send();
    }
    
    // サンプルオーディオ再生
    const selectSampleMusic = document.getElementById('select_sample_music');
    selectSampleMusic.addEventListener('change', () => {
        const file = selectSampleMusic.value;
        const input = document.getElementById('file');
        
        if (selectSampleMusic.children.length === 11) selectSampleMusic.remove(10);
        if (file === 'load') {
            input.click();
        } else {
            fetch(`./assets/audio/${file}`, decode);
        }
    });
    
    // ファイル読み込み
    const input = document.getElementById('file');
    input.addEventListener('change', () => {
        const file = input.files[0];
        const reader = new FileReader();

        const option = document.createElement('option');
        option.setAttribute('value', 1);
        option.innerHTML = file.name;
        selectSampleMusic.appendChild(option);
        selectSampleMusic.options[10].selected = true;

        reader.onload = () => decode(reader.result);
        reader.readAsArrayBuffer(file);
    });

    // 音量調整
    const volumeControl = document.querySelector('#volume');
    volumeControl.addEventListener('input', function() {
        gainNode.gain.value = this.value;
    });

    // 色変更
    const buttonChangeColor = document.getElementById('button_changeColor');
    buttonChangeColor.addEventListener('click', () => initCanvas[config.types.type]());

    // 表示変更
    const buttonChangeType = document.getElementById('button_changeType');
    buttonChangeType.addEventListener('click', () => {
        if (config.types.typeCount === 2) config.types.typeCount = -1;
        config.types.type = config.types.typeList[config.types.typeCount += 1];
        initCanvas[config.types.type](); // Canvas初期化
        drawCanvas[config.types.type](); // Canvas描画
    });

    // リサイズ
    window.onresize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 60;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height); // Canvas初期化
        initCanvas[config.types.type](); 
    };

    init();

})();