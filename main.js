git add
let audioContext = null;
let meter = null;
let canvasContext = null;
const WIDTH=500;
const HEIGHT=50;
let rafID = null;
let mediaStreamSource = null;
let counter = 4;
let intervalId = null;
let volumeValue = 0;
let tabRMS = [];
let valuemax = 0;

function main () {

    const enteruser = document.querySelector(".userform"); 
    enteruser.addEventListener("submit", createUser);

    const start = document.querySelector("#start");
    start.addEventListener("click", startMeter);
    start.addEventListener("click", startA);

}

main ();

function startMeter() {	
    
    // grab our canvas
    canvasContext = document.getElementById( "meter" ).getContext("2d");
    
    // grab an audio context
    audioContext = new AudioContext();
    
    // Attempt to get audio input
    navigator.mediaDevices.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }).then((stream) => {
            // Create an AudioNode from the stream.
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            
            console.log("mediaStreamSource :", mediaStreamSource);
            console.log("stream :", stream);
            
            // Create a new volume meter and connect it.
            meter = createAudioMeter(audioContext);
            mediaStreamSource.connect(meter);
            
            console.log("meter :", meter);
            const metervalue = meter.ScriptProcessorNode;
            console.log("meterValue :", metervalue);
            
            // kick off the visual updating
            drawLoop();
        }).catch((err) => {
            // always check for errors at the end.
            console.error(`${err.name}: ${err.message}`);
            alert('Stream generation failed.');
        });
        
    }
    
    
    function drawLoop( time ) {
        // clear the background
        canvasContext.clearRect(0,0,WIDTH,HEIGHT);
        
        // check if we're currently clipping
        if (meter.checkClipping())
            canvasContext.fillStyle = "red";
        else
        canvasContext.fillStyle = "green";
    
    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, meter.volume*WIDTH*1.4, HEIGHT);
    
    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}

function createUser (event) {
    event.preventDefault();
    
    const user = document.querySelector("#user").value.trim();
    console.log(user);
    document.querySelector("#user").value = "";
    
    // On clone la div template pour chaque user crée
    const scrollUser = document.querySelector(".scrollUser");
    const template = document.querySelector(".post-template");
    
    const cloneTemplate = template.content.cloneNode(true);
    
    const name = cloneTemplate.querySelector("#nameUser");
    name.textContent = user;
    
    // const start = cloneTemplate.querySelector("#start");
    // start.addEventListener("click", startMeter);
    // start.addEventListener("click", startA);
    
    // const bip = cloneTemplate.querySelector("#bip");
    
    // const meter = cloneTemplate.querySelector("#meter");
    
    // cloneTemplate est un enfant de scrollTask

    scrollUser.appendChild(cloneTemplate);

    const newUser = {
    name : user,
    };

    const options = {
        method : "POST",
        headers : new Headers ({
            "Content-Type" : "application/json",
        }),
        body : JSON.stringify(newUser),
    };
    
    // J'envoi la requête HTTP pour créer un produit
    fetch("http://localhost:3000/", options)
    .then(
        response => response.json())
    .then(data => {
        console.log("data reçue :", data);
    })
    .catch(err => console.log(err));
    
}

function createResult () {
    // event.preventDefault();

    const result = valuemax;
    console.log("value max :", result);

    const scrollResult = document.querySelector(".scrollResult");
    const template = document.querySelector(".templateResult");
    
    const cloneTemplate = template.content.cloneNode(true);
    
    const resultDIV = cloneTemplate.querySelector("#resultUser");
    resultDIV.textContent = result;

    scrollResult.appendChild(cloneTemplate);

}


function finish() {
    clearInterval(intervalId);
    stopMeter();
    document.getElementById("bip").innerHTML = "TERMINE!";
    // On reinitilise le compteur pour restart 
    counter = 4;
}

function bip() {
    counter--;
    if(counter <= 0) finish();

    else {	
        document.getElementById("bip").innerHTML = counter + " secondes restantes";
    }	
}

function startA(){
    intervalId = setInterval(bip, 1000);
}	

function stopMeter () {
    // var score = audioContext.value();
    console.log("score : ", audioContext);
    audioContext = audioContext.close();
    calculerMax(tabRMS); 
    createResult();
    tabRMS = [];

} 

function createAudioMeter(audioContext,clipLevel,averaging,clipLag) {
    var processor = audioContext.createScriptProcessor(512);
    
	console.log("processor : ", processor);
    
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;
    
	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);
    
	processor.checkClipping =
    function(){
        if (!this.clipping)
            return false;
        if ((this.lastClip + this.clipLag) < window.performance.now())
            this.clipping = false;
        return this.clipping;
    };
    
	processor.shutdown =
    function(){
        this.disconnect();
        this.onaudioprocess = null;
    };
    
	return processor;
}


function volumeAudioProcess( event ) {
    var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
	var sum = 0;
    var x;

	// Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}
    	sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

	// console.log("rms :" , rms);
    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*this.averaging);
	console.log("volume :" , this.volume);
	
	
    for (var i=0; i<bufLength; i++) {
		tabRMS.push(rms);
	};

	// const valuemax = Math.max(...tabRMS);
	// // console.log("tabRMS :" , tabRMS);
	// console.log("tabRMS :" , tabRMS);
	// console.log("valuemax :" , valuemax);

	// volumeValue = this.volume;
    // console.log("volumeValue in vol : ", volumeValue);

	return tabRMS;

}

function calculerMax (tabRMS) {
    valuemax = (100*Math
        .max(...tabRMS))
        .toFixed(2)
    ;
	console.log("max value1", valuemax);
    return valuemax;
}

function POSTnewProduct() {
    const options = {
        method : "POST",
        headers : new Headers ({
            "Content-Type" : "application/json",
        }),
        body : JSON.stringify(newProduct),
    };
    
    console.log(options);

    // J'envoi la requête HTTP pour créer un produit
    fetch("http://0.0.0.0:4004/new-product", options)
    .then(
        response => response.json())
    .then(data => {
        console.log("data reçue :", data);
    })
    .catch(err => console.log(err));
}
