const chatBody = document.querySelector(".chat-body");
let inputSec = document.querySelector(".input-sec");

const txtInput = document.querySelector("#txtInput");
txtInput.disabled = "true";
txtInput.placeholder = `Text is disabled for beta version.
`;
const send = document.querySelector(".send");
let speechDetectedLanguage = "";
const chatHistory = [];
let currentVideoElement = null;
let currentAudioSource = null;
let session_id = "";
const inputField = document.getElementById("txtInput");
const translate = document.getElementById("translate");
const sendIcon = document.getElementById("sendmsg");
const senddiv = document.getElementById("senddiv");
const chatHeader = document.getElementById("chat-header");
const chatContainer = document.getElementById("chat-container");
const minimizeChatButton = document.getElementById("minimize-chat");
const circleChatIcon = document.getElementById("reset-chat");
const chatIcon = document.getElementById("chat-icon");
const settingsDiv = document.getElementById("settingsdiv");
const contrastSwitch = document.getElementById("contrast-switch");
const fontSizeButtons = document.querySelectorAll(".font-size-button");
let audioChunks = [];
let isRecording = false;
let mediaRecorder;

let inputClickableDiv = document.createElement("div");
inputSec.style.position = "relative";
inputSec.appendChild(inputClickableDiv);
inputClickableDiv.style.width = "100%";
inputClickableDiv.style.height = "100%";
inputClickableDiv.style.position = "absolute";
// inputClickableDiv.style.background = "red";

inputClickableDiv.style.zIndex = "100";
inputSec.style.zIndex = "10";

// make the inputClickableDiv at the center of the inputSec
inputClickableDiv.style.top = inputSec.offsetHeight / 2 - inputClickableDiv.offsetHeight / 2 + "px";
inputClickableDiv.style.left = inputSec.offsetWidth / 2 - inputClickableDiv.offsetWidth / 2 + "px";
// make the inputClickableDiv to be on top of inputSec and add an click addEventListener.

//This will run fisrt when page loads
window.onload = async function () {
  await getConversationId();
};

//Handle input text
txtInput.addEventListener("keyup", (event) => {
  if (event.keyCode === 13) {
    renderUserMessage();
  }
});

const jsonData = {
  data: [
    {
      id: 1,
      question: "What is your name?",
      answer: "My name is ChatBot.",
    },
    {
      id: 2,
      question: "uploading",
      answer: {
        quick_replies: ["Select file", "Camera", "Skip"],

        translated_response: "",
        imageType: "oral",
        images: [
          "./assets/oral-tongue.jpg",
          "./assets/oral-face.jpeg",
          "./assets/oral-mouth.jpg",
         ],
      },
    },
    {
      id: 3,
      question: "uploading",
      answer: {
        quick_replies: ["Select file", "Camera", "Skip"],

        translated_response: "",
        imageType: "skin",
        images: [
          "./assets/skin-hand.jpg",
          "./assets/skin-vitiligo.jpg",
          "./assets/skin-body.jpeg",
         ],
      },
    },
  ],
};

function formatStringDataToObject(stringData) {
  const keyValuePairs = stringData.split(/\r\n|\r|\n/);

  const formattedData = keyValuePairs
    .map((pair) => {
      const [title, value] = pair.split(": ");
      const percentage = parseInt(value.trim(), 10) || 0;

      const titleTrimmed = title.trim();
      const divName = titleTrimmed.charAt(0).toLowerCase() + titleTrimmed.slice(1) + "RiskChart";

      // Check if the title is 'Image'; if yes, skip creating an object for it
      if (titleTrimmed.toLowerCase() === "image") {
        return null; // Skip creating an object for the 'Image' key
      }

      return {
        title: titleTrimmed,
        percentage: percentage,
        divName: divName,
      };
    })
    .filter(Boolean); // Filter out any null values (for 'Image' key)

  return formattedData;
}

const gaugeChartDataArray = [
  {
    title: "Overall",
    percentage: 88,
    divName: "overAllRiskChart",
  },
  {
    title: "Sexual",
    percentage: 66,
    divName: "sexualRiskChart",
  },
  {
    title: "Mental",
    percentage: 42,
    divName: "mentalRiskChart",
  },
  {
    title: "Oral",
    percentage: 75,
    divName: "oralRiskChart",
  },
];

function chartOptionStyle(lineWidth, radiusScale) {
  var opts = {
    colorStart: "#6fadcf",
    colorStop: void 0,
    gradientType: 0,
    strokeColor: "#e0e0e0",
    generateGradient: true,
    percentColors: [
      [0.0, "#a9d70b"],
      [0.5, "#f9c802"],
      [1.0, "#ff0000"],
    ],
    pointer: {
      length: 0.5,
      strokeWidth: 0.035,
      iconScale: 5.0,
    },
    staticLabels: {
      font: "10px sans-serif",
      labels: [],

      fractionDigits: 0,
    },
    // static zones
    staticZones: [
      { strokeStyle: "#7fd333", min: 0, max: 30 },
      { strokeStyle: "#4a53f2", min: 30, max: 60 },
      { strokeStyle: "#ff5c5c", min: 60, max: 100 },
    ],
    angle: -0.2,
    lineWidth: lineWidth,
    radiusScale: radiusScale,
    fontSize: 40,
    limitMax: true,
    limitMin: true,
    highDpiSupport: true,
  };
  return opts;
}

// Call the function with the array of chart data

async function triggerJsonData(question) {
  for (const item of jsonData.data) {
    if (item.question.toLowerCase().includes(question.toLowerCase())) {
      return item.answer;
    }
  }
  return "I'm sorry, I don't understand that question.";
}
function openFilePicker() {
  document.getElementById("file-input").click();
}

//Handling messages of the user
async function renderUserMessage() {
  const userInput = txtInput.value;
  if (userInput.length > 0) {
    txtInput.value = "";
    setScrollPosition();
    if (userInput.toLowerCase().includes("upload")) {
      const output = await triggerJsonData(userInput);
      renderMessageEle(output, "bot");
    } else if (userInput.toLowerCase().includes("card")) {
      renderMessageEle(gaugeChartDataArray, "bot");

      // renderMessageEle(chartData, "bot");
    } else {
      renderMessageEle(userInput, "user");
    }
    await renderChatbotResponse(userInput);
  }
}


// payload for image.
function sendImage(base64Image) {
  let conversation_id = localStorage.getItem("conversation_id");
  const message = {
    type: "message",
    text: "This is an image attachment.",
    from: { id: conversation_id },
  };

  // Extract image type dynamically
  const base64Parts = base64Image.split(",");
  if (base64Parts.length > 1) {
    const contentType = base64Parts[0].match(/:(.*?);/)[1];
    base64Image = base64Parts[1]; // Extract base64 data without the prefix
    message.text = base64Image;
    message.imageType = contentType; // Store the image type in the message
  }

  return message;
}

var input;
let fileSelected = true;


// This is for handling image upload.
function handleImageUpload() {
  fileSelected = false;

  if (input) {
    input.remove();
  }
  // Creating input element for selecting images
  input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none"; // Hide the input element
  input.id = "uploadImage";
  document.body.appendChild(input);

  // Event listener for file input change
  document.getElementById("uploadImage").addEventListener("change", function (event) {
    var file = event.target.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.src = e.target.result;
        img.width = 100;
        img.height = 100;
        renderMessageEle(img.src, "user-image");
        let message = sendImage(img.src);

        let direct_line_secret = "NyMlvCwe_i8.8lTnKqtAI_HbcqdT1haoEfLRjZRMBSe9G0nNDiRnj_Y";

        let conversation_id = localStorage.getItem("conversation_id");
        let base_url = "https://directline.botframework.com/v3/directline";
        let url = `${base_url}/conversations/${conversation_id}/activities`;

        renderChatbotResponse(message);
      };
      fileSelected = true;

      reader.readAsDataURL(file);
    }
    if (!file || input === null || input === undefined) {
      fileSelected = false;
    }
  });

  input.click();
}


// enabling quick_replies button;
function enableQuickButton() {
  let quickbtns = document.getElementsByClassName("quickbtn");
  for (let i = 0; i < quickbtns.length; i++) {
    quickbtns[i].disabled = false;
    quickbtns[i].style.opacity = 1;
    quickbtns[i].style.cursor = "pointer";
  }
}




let photoSent = true;

// This is for handling the Camera functionality.
var myApp = (function () {
  var width = 320;
  var height = 240;
  var videoStream = null;

  var video = document.createElement("video");
  video.id = "video";
  video.style.cssText = `
    border: 1px solid black;
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;

  var canvas = document.createElement("canvas");
  canvas.id = "canvas";
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = "none";

  var photo = document.createElement("img");
  photo.id = "photo";
  photo.alt = "The screen capture will appear in this box.";
  photo.style.cssText = `
    border: 1px solid black;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: none;
  `;
  const captureButton = document.createElement("div");
  captureButton.classList.add("capture-button");
  const cameraIcon = document.createElement("span");
  cameraIcon.classList.add("material-symbols-outlined");
  cameraIcon.classList.add("camera-icon");
  cameraIcon.textContent = "photo_camera";
  captureButton.appendChild(cameraIcon);

  const retakeButton = document.createElement("div");
  const retakeIcon = document.createElement("span");
  retakeIcon.classList.add("material-symbols-outlined");
  retakeIcon.classList.add("camera-icon");

  retakeIcon.textContent = "undo";
  retakeButton.appendChild(retakeIcon);
  retakeButton.classList.add("retake-button");
  const closeButton = document.createElement("div");
  const closeButtonIcon = document.createElement("span");
  closeButtonIcon.classList.add("material-symbols-outlined");
  closeButtonIcon.classList.add("camera-icon");

  closeButtonIcon.textContent = "cancel";
  closeButton.classList.add("closeCamera-button");
  closeButton.appendChild(closeButtonIcon);
  const sendButton = document.createElement("div");
  const sendButtonIcon = document.createElement("span");
  sendButtonIcon.classList.add("material-symbols-outlined");
  sendButtonIcon.classList.add("camera-icon");

  sendButtonIcon.textContent = "send";
  sendButton.classList.add("send-button");
  sendButton.appendChild(sendButtonIcon);

  const switchCameraIconDiv = document.createElement("div");
  const switchCameraIconDivIcon = document.createElement("span");
  switchCameraIconDivIcon.classList.add("material-symbols-outlined");
  switchCameraIconDivIcon.classList.add("camera-icon");
  switchCameraIconDivIcon.textContent = "switch_camera";
  switchCameraIconDiv.classList.add("switchCamera-button");
  switchCameraIconDiv.appendChild(switchCameraIconDivIcon);

  const container = document.createElement("div");
  container.style.cssText = `
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #fff;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end; /* Align buttons to the bottom */
    z-index: 9999;
  `;

  var previewContainer = document.createElement("div");
  previewContainer.style.cssText = `
    width: 100%;
    height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  `;
  previewContainer.appendChild(video);
  previewContainer.appendChild(canvas);
  previewContainer.appendChild(photo);

  container.appendChild(previewContainer);

  const buttonContainerLeft = document.createElement("div");
  const buttonContainerRight = document.createElement("div");
  buttonContainerLeft.appendChild(closeButton);
  buttonContainerLeft.appendChild(captureButton);
  buttonContainerLeft.appendChild(switchCameraIconDiv);

  buttonContainerLeft.style.cssText = `
  width: 100%;
  display:flex;
  justify-content:space-between;
  align-items: center;
  padding:8px;
  position:absolute;
  bottom:10px;
  z-index: 1; 

`;

  buttonContainerRight.style.cssText = `
  width: 100%;
  display:flex;
  justify-content:space-between;
  align-items: center;
  padding:8px;
  position:absolute;
  bottom:10px;
  z-index: 1;


`;
  buttonContainerRight.appendChild(retakeButton);
  buttonContainerRight.appendChild(sendButton);

  container.appendChild(buttonContainerLeft);
  container.appendChild(buttonContainerRight);

  document.body.appendChild(container);

  var activeStream;
  var videoDevices = [];

  function getDevices() {
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
      videoDevices = devices.filter(function (device) {
        return device.kind === "videoinput";
      });

      if (videoDevices.length >= 2) {
        switchCameraIconDiv.style.display = "block"; // Display the switch camera button
      }
    });
  }

  function resetUI() {
    photo.style.display = "none";
    captureButton.style.display = "block";
    retakeButton.style.display = "none";
    sendButton.style.display = "none";
    closeButton.style.display = "block";
    video.style.display = "block";
  }
  function showCameraPreview() {
    container.style.display = "flex"; // Display the container when camera is accessed
  }

  function adjustVideoHeight() {
    var windowHeight = window.innerHeight;
    video.style.height = windowHeight + "px";
  }

  function fixMirrorEffect() {
    video.style.transform = "scaleX(-1)"; // Apply horizontal flip transformation
  }

  function startup() {
    resetUI(); // Reset UI elements when starting up
    container.style.display = "flex"; // Display the container when camera is accessed
    fixMirrorEffect(); // Fix mirror effect

    function toggleButtonsBeforeCapture() {
      closeButton.style.display = "block";
      switchCameraIconDiv.style.display = "block";
      captureButton.style.display = "block";
      retakeButton.style.display = "none";
      sendButton.style.display = "none";
    }

    function toggleButtonsAfterCapture() {
      closeButton.style.display = "none";
      switchCameraIconDiv.style.display = "none";
      captureButton.style.display = "none";
      retakeButton.style.display = "block";
      sendButton.style.display = "block";
    }
    // container.style.display = "flex";
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(function (stream) {
        videoStream = stream;
        video.srcObject = stream;

        // Check for iOS and Android to set appropriate playsinline attributes
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isAndroid = /Android/.test(navigator.userAgent);

        if (iOS) {
          video.setAttribute("playsinline", true);
          video.setAttribute("webkit-playsinline", true);
        } else if (isAndroid) {
          video.setAttribute("playsinline", true);
        }
        video.play();
        showCameraPreview();
      })
      .catch(function (err) {
        console.log("An error occurred: " + err);
      });

    video.addEventListener(
      "canplay",
      function (ev) {
        // Adjust height based on the video's aspect ratio
        if (video.videoWidth && video.videoHeight) {
          height = video.videoHeight / (video.videoWidth / width) || height;
          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          showCameraPreview();
        }
      },
      false
    );

    captureButton.onclick = function () {
      takePicture();
      toggleButtonsAfterCapture();
    };
    retakeButton.onclick = function () {
      retakePicture();
      toggleButtonsBeforeCapture();
    };
    closeButton.onclick = closeCamera;
    sendButton.onclick = sendPhoto;
    toggleButtonsBeforeCapture();
    photoSent = true;
  }
  let currentCamera = "user"; // Initially set to front camera

  function handleVideo(cameraFacing) {
    currentCamera = cameraFacing;
    const constraints = {
      video: {
        facingMode: {
          exact: cameraFacing,
        },
      },
      audio: false,
    };
    return constraints;
  }

  function switchCamera() {
    const constraints = handleVideo(currentCamera);

    if (video.srcObject) {
      const currentTracks = video.srcObject.getTracks();
      currentTracks.forEach((track) => track.stop());
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        activeStream = stream;
        video.srcObject = stream;
        video.play();
        showCameraPreview();
        if (currentCamera === "environment") {
          fixMirrorEffect();
        } else {
          video.style.transform = ""; // Remove horizontal flip transformation for front camera
        }
        // Update any UI elements indicating the active camera
      })
      .catch(function (error) {
        if (error.name === "OverconstrainedError") {
          console.log("OverconstrainedError - Cannot switch cameras with current constraints.");
          // Provide appropriate feedback to the user
        } else {
          console.log("Error switching camera: ", error);
        }
      });
    if (!photoSent) {
      closeCamera();
    }
  }

  // switchCameraIconDiv.addEventListener("click", switchCamera);
  switchCameraIconDiv.addEventListener("click", () => {
    if (currentCamera === "user") {
      currentCamera = "environment";
    } else {
      currentCamera = "user";
    }
    switchCamera();
  });

  getDevices(); // Call to get the available devices on startup

  function showCameraPreview() {
    video.style.display = "block";
    captureButton.style.display = "block";
    closeButton.style.display = "block";
  }

  function takePicture() {
    var context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, width, height);
    var data = canvas.toDataURL("image/png");
    photo.src = data;
    photo.style.display = "block";
    container.style.display = "flex";
    captureButton.style.display = "none";
    retakeButton.style.display = "block";
    sendButton.style.display = "block";
    closeButton.style.display = "none";
    video.style.display = "none"; // Hide the camera view
    video.style.height = "100svh"; // Hide the camera view
    // video.style.height = window.innerHeight + 'px'; // Set video height to match window height

    photo.style.transform = "scaleX(-1)";
  }

  function retakePicture() {
    photo.style.display = "none";
    captureButton.style.display = "block";
    retakeButton.style.display = "none";
    sendButton.style.display = "none";
    closeButton.style.display = "block";
    video.style.display = "block"; // Show the camera view
  }

  function closeCamera() {
    var tracks = videoStream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    video.srcObject = null; // Release the video stream

    container.style.display = "none";
    photo.style.display = "none"; // Ensure photo is hidden when camera is closed
  }

  function sendPhoto() {
    var data = photo.src;
    let message = sendImage(data);

    var input = document.createElement("input");
    var img = new Image();
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none"; // Hide the input element
    input.id = "uploadImage";
    img.src = data;
    img.width = 100;
    img.height = 100;
    // if(img.currentSrc!=""){
    // }
    renderMessageEle(img.src, "user-image");

    // Assuming you have an input element with id "imageInput"
    var imageInput = document.getElementById("imageInput");
    if (imageInput) {
      imageInput.value = data;
      // Display the image on the screen
      var imageDisplay = document.createElement("img");
      imageDisplay.src = data;
      imageDisplay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 9999;
      `;
      document.body.appendChild(imageDisplay);
    }
    photoSent = false;

    renderChatbotResponse(message);
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
      video.srcObject = null; // Release the video stream
    }

    closeCamera();
  }

  return {
    startup: startup,
  };
})();


// Extracting object data for Risk Chart, "GaugeChart".
const extractObjectsFromInput = (inputData) => {
  const objectsArray = [];
  const regex = "/{[^{}]*}/g";
  const matches = inputData.match(regex);

  if (matches) {
    matches.forEach((match) => {
      try {
        const obj = JSON.parse(match);
        objectsArray.push(obj);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });
  }

  return objectsArray;
};

// Function to check if the input object has a 'carousel' property
function containsCarouselProperty(jsonString) {
  try {
    const jsonObject = JSON.parse(jsonString);
    return jsonObject.hasOwnProperty("carousle");
  } catch (error) {
    return false; // Return false if the JSON string is invalid
  }
}

const customThumbnails = [
  "./assets/card1.png",
  "./assets/card2.png",
  "./assets/card1.png",
  // Add more custom image URLs as needed
];

// Checking the format for Risk Score.
function checkFormat(response) {
  // Regular expression to match the format <b>XX%</b>
  const regex = /<b>\d+%<\/b>/;

  // Check if the response matches the expected format
  const match = regex.test(response);

  return match; // Return true if the format matches, otherwise false
}


// Extracting the Risk Score from the text Response.
function extractPercentageValue(response) {
  // Regular expression to match the format <b>XX%</b>
  const regex = /<b>(\d+)%<\/b>/;

  // Check if the response matches the expected format
  const match = response.match(regex);

  if (match && match.length === 2) {
    // Extract the percentage value
    const percentage = parseInt(match[1], 10);
    return percentage;
  } else {
    return null; // Return null if the format doesn't match
  }
}

// Extracting the carousel Data. from API Reponse.
function extractCarouselData(data) {
  if (containsCarouselProperty(data)) {
    const parsedData = JSON.parse(data);
    const carouselData = parsedData.carousle;
    delete parsedData.carousle; // Removing the 'carousle' property

    // Adding 'thumbnail' property to each object in carouselData
    const updatedCarouselData = carouselData.map((item, index) => {
      if (index < customThumbnails.length) {
        return { ...item, thumbnail: customThumbnails[index] };
      } else {
        return item; // If customThumbnails doesn't have enough images, keep the original object
      }
    });

    return updatedCarouselData;
  } else {
    return null; // Return null if 'carousle' property is not found
  }
}
//Handling messages of the chatbot responses
async function renderChatbotResponse(userInput, detected_language) {
  //Will be used for text to speech
  if (detected_language != undefined) {
    speechDetectedLanguage = userInput.detected_language;
  }

  //Disabling input and showing loading animation untill the response comes
  showLoadingAnimation();
  // showLoadingAnimationinsend();
  // disableInput();

  //getting the chatbot response
  let res = await getChatbotResponse(userInput);

  let botResponse = res.activities[res.activities.length - 1];
  const lastReplyToId = botResponse.replyToId;

  function getObjectsByReplyToId(replyToId) {
    if (replyToId === "" || replyToId === undefined) {
      return "something went wrong";
    }
    const matchedObjects = res.activities.filter((obj) => obj.replyToId === replyToId);
    return matchedObjects;
  }
  const replyToIdObjectData = getObjectsByReplyToId(lastReplyToId);
  if (
    botResponse.text ===
    `If you feel informed, based on your risk score, it is wise to take your first step by choosing \"one or few options\" listed below:`
  ) {
    imageUploadText = res.activities.slice(Math.max(res.activities.length - 1 - 2, 0));
  }
  chatBody.removeChild(chatBody.lastChild);

  enableInput(); //ENabling all the disabled buttons and input during api calls

  // const notificationAudio = new Audio("/assets/ping.mp3");

  let formattedobj;

  if (replyToIdObjectData != undefined && replyToIdObjectData.length >= 1) {
    replyToIdObjectData.forEach((element) => {
      if (checkFormat(element.text)) {
        let percentageTextValue = extractPercentageValue(element.text);
        if (percentageTextValue >= 0 && percentageTextValue <= 30) {
          renderMessageEle({
            translated_response: `We have assessed your score based on your responses. Your <b>"Chance Assessment"</b> Score is <span style="color:#34c759; font-weight:800">${percentageTextValue}%</span>.`,
            urls: [],
          });
        } else if (percentageTextValue >= 30 && percentageTextValue <= 60) {
          renderMessageEle({
            translated_response: `We have assessed your score based on your responses. Your <b>"Chance Assessment"</b> Score is <span style="color:#4a53f2; font-weight:800">${percentageTextValue}%</span>.`,
            urls: [],
          });
        } else if (percentageTextValue >= 60 && percentageTextValue <= 100) {
          renderMessageEle({
            translated_response: `We have assessed your score based on your responses. Your <b>"Chance Assessment"</b> Score is <span style="color:#ff5c5c; font-weight:800">${percentageTextValue}%</span>.`,
            urls: [],
          });
        }
      } else if (containsCarouselProperty(element.text)) {
        formattedobj = extractCarouselData(element.text);
      } else if (
        element.text ===
        "Please capture or upload “only” the specific lesion on your mouth, lip, or tongue, as shown in the sample images."
      ) {
        renderMessageEle({
          translated_response: element.text,
          urls: [],
        });
        renderMessageEle(jsonData.data[1].answer, "bot");
      } else if (
        element.text ===
        "Please capture or upload “only” the specific lesion on your scalp, neck, hand, or back, as shown in the sample images."
      ) {
        renderMessageEle({
          translated_response: element.text,
          urls: [],
        });
        renderMessageEle(jsonData.data[2].answer, "bot");
      } else if (element.text === "Please upload skin image") {
        renderMessageEle({
          translated_response: element.text,
          urls: [],
        });
        renderMessageEle(jsonData.data[2].answer, "bot");
      } else if (
        element.text === `Image: 1` ||
        element.text === "Image score (skin) is 1" ||
        element.text === "Image score (oral) is 1" ||
        element.text === `Image: 2` ||
        element.text === "Image score (skin) is 2" ||
        element.text === "Image score (oral) is 2"
      ) {
        renderMessageEle({
          translated_response: "matched",
          urls: [],
        });
      } else if (
        element.text === `Image: 0` ||
        element.text === "Image score (skin) is 0" ||
        element.text === "Image score (oral) is 0"
      ) {
        renderMessageEle({
          translated_response: "unmatched",
          urls: [],
        });
      } else {
        renderMessageEle({
          translated_response: element.text,
          urls: [],
        });
      }
    });

    //if detected_language is not null then calling texttoaudio api
    if (detected_language && res.cards.length == 0) {
      let translatedtext = res.translated_response;
      translatedtext = translatedtext.replace(/\[([^\]]+)\]\(([^)]+)\)/gi, " "); // to replace links to empty
      translatedtext = translatedtext.replace(/\*\*(.*?)\*\*/g, ""); //to replace strong tag to empty

      let obj = {
        text: translatedtext,
        detected_language: detected_language,
      };
      getTextToAudioResponse(obj);
    }
  }


  if (formattedobj?.length > 0) {
    renderCarouselCards(formattedobj);
  }
  if (botResponse.suggestedActions?.actions?.length >= 1) {
    let renderCardsItems = botResponse.suggestedActions.actions;
    let renderCardsArray = [];
    for (let i in renderCardsItems) {
      renderCardsArray.push(renderCardsItems[i].value);
    }
    renderCards(renderCardsArray);
  }
  setScrollPosition();
}
function handleResize() {
  // Get the current screen width
  const screenWidth = window.innerWidth;
}

// Add event listener for window resize
window.addEventListener("resize", handleResize);

// Initial call to display the screen width on page load
handleResize();

function convertCanvasToImage(canva) {
  const image = new Image();
  image.src = canva.toDataURL("image/*"); // Convert canvas to PNG image (you can change the format as needed)
  return image;
}

function differentiateResponse(response) {
  // Check if the response contains key-value pairs separated by newlines
  const keyValuePattern = /^[^:\r\n]+: [^:\r\n]+([\r\n]+[^:\r\n]+: [^:\r\n]+){3,}$/;
  // const keyValuePattern = /^(\w+:\s\d+\r\n){3,}$/;

  const isKeyValueResponse = keyValuePattern.test(response);

  // Return a flag indicating whether it matches the key-value pair pattern
  return isKeyValueResponse ? "keyValueResponse" : "simpleTextResponse";
}

function detectDataType(data) {
  const isFormattedData = data.includes("<b>") && data.includes("<a href=");

  if (isFormattedData) {
    // Process formatted data;
    return true;
  }
  return false;
}

function CheckObjectFormatting(data) {
  try {
    const trimmedData = data.trim(); // Remove leading/trailing whitespace

    // Check if the trimmed data starts and ends with curly braces '{' and '}' indicating an object
    if (trimmedData.startsWith("{") && trimmedData.endsWith("}")) {
      const parsedData = JSON.parse(trimmedData);

      // Check if the parsed data contains keys that match the expected properties
      if (
        parsedData.hasOwnProperty("title") &&
        parsedData.hasOwnProperty("description") &&
        parsedData.hasOwnProperty("link")
      ) {
        return true;
      }
    }
  } catch (error) {
    return false;
  }

  return false;
}

const isSpecialInputFormat = (input) => {
  return input.startsWith("{{") && input.endsWith("}}");
};

// Function to differentiate between special input format and others
const differentiateInput = (input) => {
  return isSpecialInputFormat(input);
};

//rendering chatbot/user messages
const renderMessageEle = async (content, type) => {
  let className = "user-message";
  if (type !== "user" && type !== "user-audio" && type !== "user-image") {
    className = "chatbot-message";
  }
  if (type === "bot") {
    className = "chatbot-message";
  }

  let isKeyValueResponse;
  if (content.translated_response) {
    isKeyValueResponse = differentiateResponse(content?.translated_response);
  }
  if (isKeyValueResponse === "keyValueResponse") {
    content = formatStringDataToObject(content?.translated_response);
  }

  let messageEle = document.createElement("div");
  messageEle.classList.add(className);

  if (type === "user-image" && content !== undefined) {
    messageEle.classList.add("user-message");
    const imgElement = document.createElement("img");
    imgElement.width = 100;
    imgElement.height = 100;
    imgElement.src = content;

    messageEle.appendChild(imgElement);
    chatBody.append(messageEle);
  }

  if (className === "chatbot-message" && content.translated_response === "matched") {
  }

  if (content.translated_response === "matched") {
    className = "chatbot-message-image";

    const imageContainer = document.createElement("div");
    imageContainer.id = "image-container";
    imageContainer.classList.add("image-container");
    imageContainer.style.display = "flex";
    imageContainer.style.flexWrap = "wrap";
    imageContainer.style.width = "100%";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.alignItems = "center";

    const imgElement = document.createElement("img");
    imgElement.src = "./assets/highRisk.png";
    imgElement.classList.add("chatbot-image");
    // imgElement.style.width = "100%";
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "cover";
    imgElement.style.margin = "5px";
    imageContainer.appendChild(imgElement);

    messageEle.appendChild(imageContainer);
    chatBody.append(messageEle);
    if (messageEle.contains(imageContainer)) {
      if (content.quick_replies != "") {
        renderCards(content.quick_replies);
      }
    }
  }

  if (content.translated_response === "unmatched") {
    className = "chatbot-message-image";
    const imageContainer = document.createElement("div");
    imageContainer.id = "image-container";
    imageContainer.classList.add("image-container");
    imageContainer.style.display = "flex";
    imageContainer.style.flexWrap = "wrap";
    imageContainer.style.width = "100%";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.alignItems = "center";

    const imgElement = document.createElement("img");
    imgElement.src = "./assets/lowRisk.png";
    imgElement.classList.add("chatbot-image");
    // imgElement.style.width = "100%";
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "cover";
    imgElement.style.margin = "5px";
    imageContainer.appendChild(imgElement);

    messageEle.appendChild(imageContainer);
    chatBody.append(messageEle);
    if (messageEle.contains(imageContainer)) {
      if (content.quick_replies != "") {
        renderCards(content.quick_replies);
      }
    }
  }

  if (type === "bot") {
    const imageContainer = document.createElement("div");
    imageContainer.id = "image-container";
    imageContainer.classList.add("image-container");
    imageContainer.style.display = "flex";
    imageContainer.style.flexWrap = "wrap";
    imageContainer.style.width = "100%";
    imageContainer.style.justifyContent = "space-between";

    for (let i = 0; i < content.images.length; i++) {
      const imageUrl = content.images[i];
      let imgTitle;
      if (content.imageType === "oral") {
        imgTitle = "Oral Lesion"; // Title based on the index
      }
      if (content.imageType === "skin") {
        imgTitle = "skin Lesion"; // Title based on the index
      }

      const cardContainer = document.createElement("div");
      cardContainer.classList.add("card-container");
      cardContainer.style.textAlign = "center";
      cardContainer.style.margin = "5px";

      const imgElement = document.createElement("img");
      imgElement.src = imageUrl;
      imgElement.classList.add("chatbot-image");
      imgElement.style.objectFit = "cover";

      const titleElement = document.createElement("p");
      titleElement.id = "image_title";
      titleElement.textContent = imgTitle;
      titleElement.style.fontSize = "8px";

      cardContainer.appendChild(imgElement);
      cardContainer.appendChild(titleElement);
      imageContainer.appendChild(cardContainer);
    }

    messageEle.appendChild(imageContainer);
    imageContainerAppended = true;

    if (imageContainer && messageEle.contains(imageContainer)) {
      if (content.quick_replies !== "") {
        setTimeout(() => {
          renderCards(content.quick_replies);
        }, 10);
      }
    }
  }

  if (isKeyValueResponse === "keyValueResponse") {
    const messageContainer = document.createElement("div");
    messageContainer.style.display = "flex";

    let gaugeChartContainer = document.createElement("div");
    messageContainer.appendChild(gaugeChartContainer);

    messageContainer.classList.add("message-container");
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");
    const profilePhoto = document.createElement("img");
    profilePhoto.src = "./assets/logo.png"; // Replace 'path_to_chatbot_image' with the actual path of the chatbot's profile photo
    profilePhoto.classList.add("profile-photo");
    imageContainer.appendChild(profilePhoto);

    messageContainer.appendChild(imageContainer);
    messageContainer.appendChild(messageEle); // Appending messageEle directly
    messageContainer.style.display = "flex";
    chatBody.append(messageContainer);

    gaugeChartContainer.id = "gaugeChartContainer";
    gaugeChartContainer.classList.add("gaugeChartContainer");
    gaugeChartContainer.style.width = "100%";
    gaugeChartContainer.style.position = "relative";
    gaugeChartContainer.style.display = "flex";
    gaugeChartContainer.style.flexDirection = "column";
    gaugeChartContainer.style.textAlign = "center";

    let chartWrapper = document.createElement("div");
    chartWrapper.id = "chartWrapper";
    const lengendContainer = document.createElement("div");
    lengendContainer.id = "lengendContainer";
    lengendContainer.style.background = "#fff";
    lengendContainer.style.borderRadius = "10px";
    lengendContainer.style.textAlign = "left";
    lengendContainer.style.padding = "0 10px";

    const imgElement = document.createElement("img");
    imgElement.src = "./assets/legendRisk.png";
    imgElement.style.width = "100%";
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "cover";
    imgElement.style.margin = "5px";
    lengendContainer.appendChild(imgElement);

    content.forEach((chartData) => {
      let chartContainer = document.createElement("div");
      chartContainer.style.backgroundColor = "#ffffff";
      chartContainer.style.borderRadius = "10px";
      chartContainer.style.margin = "2px";
      chartContainer.style.width = "100%";

      gaugeChartContainer.appendChild(chartContainer);
      gaugeChartContainer.appendChild(chartWrapper);
      gaugeChartContainer.appendChild(lengendContainer);

      let previewTextField = document.createElement("div");
      var titleElement = document.createElement("div");
      var canvas = document.createElement("canvas");
      // previewTextField.textContent = `${chartData.percentage}+ %`;

      canvas.id = "chartCanvas";
      let chartOptions = {};

      if (chartData.divName != "overallRiskChart") {
        chartWrapper.appendChild(chartContainer);
        chartOptions = chartOptionStyle(0.15, 0.5);
        canvas.width = 80;
        canvas.height = 60;
        chartContainer.style.width = "33%";

        // canvas.style.width = "100%";
        // canvas.style.height="auto";
      } else {
        gaugeChartContainer.appendChild(chartContainer);
        chartOptions = chartOptionStyle(0.24, 0.8);
        // canvas.style.width = "100%";
        // canvas.style.height = "auto";
        chartContainer.style.width = "100%";

        canvas.width = 140;
        canvas.height = 60;
      }

      let chartParentContainer = document.createElement("div");
      document.body.appendChild(chartParentContainer);
      chartParentContainer.style.position = "absolute";
      chartParentContainer.style.left = "-9999px";

      chartContainer.appendChild(titleElement);
      let canvasImage = new Image();
      canvasImage.id = "canvasImage";
      canvasImage.style.height = "auto";
      canvasImage.style.width = "100%";
      setTimeout(() => {
        canvasImage.src = canvas.toDataURL();
      }, 100);

      chartContainer.appendChild(previewTextField);

      chartParentContainer.appendChild(canvas);
      chartContainer.appendChild(canvasImage);

      // Convert canvas to image after the drawing is completed

      canvas.classList.add("canvas");
      // canvas.style.backgroundColor = "#f3f4f6";
      canvas.style.borderRadius = "20px";
      chartContainer.style.position = "static";
      canvas.style.position = "relative";

      // Create the Gauge instance

      // Add the title dynamically
      previewTextField.className = "preview-textfield";
      previewTextField.style.fontSize = "15px";
      previewTextField.style.fontWeight = "700";
      // previewTextField.textContent = `${chartData.percentage}%`;

      titleElement.innerHTML = chartData.title;
      titleElement.style.font = "15px sans-serif";
      titleElement.style.color = "#333";
      titleElement.style.textAlign = "center";

      // Set other properties and values as needed
      var gauge = new Gauge(canvas).setOptions(chartOptions);

      gauge.setTextField(previewTextField);
      gauge.maxValue = 100;
      gauge.setMinValue(0);
      gauge.animationSpeed = 1;

      // gauge.setMaxValue(100);
      gauge.set(chartData.percentage);
      // previewTextField.textContent = `${chartData.percentage}%`;

      // Display the percentage value at the center
      gauge.percentColor = "#333";

      // Set the div name if provided
      if (chartData.divName) {
        chartContainer.id = chartData.divName;
        chartContainer.className = chartData.divName;
      }
      // chartContainer.style.width = "33%";
      chartWrapper.style.width = "100%";
      chartWrapper.style.display = "flex";
    });

    // Example usage:
    chatBody.appendChild(gaugeChartContainer);
    messageEle.appendChild(gaugeChartContainer);
  }

  //If msg type is user-speech
  if (type == "user-audio") {
    const preelement = document.createElement("pre");
    preelement.textContent = content.transcripts;
    messageEle.appendChild(preelement);

    //calling api if it is user-audio
    await renderChatbotResponse(content.transcripts[0], content.detected_language);
  }

  //If Message type is chatbotmessage
  else if (type != "user" && type != "user-audio") {
    var expression = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    var regexs = new RegExp(expression);
    content.translated_response = content.translated_response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); //Making ** into strong tag
    let modifiedContent = content.translated_response.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (match, $1, $2) {
      if ($1.includes("Doc")) {
        $1 = $1.replace("Doc", "");
        return '<sup style="font-weight:bold;"><a href="' + $2 + '" target="_blank">[' + $1 + "]</a></sup>&nbsp;";
      } else {
        return '<a href="' + $2 + '" target="_blank">' + $1 + "</a>";
      }
    });

    const preEle = document.createElement("pre");
    let emptyPreEle = document.createElement("pre");
    emptyPreEle.innerHTML = " ";
    if (preEle.innerHTML === "matched" || preEle.innerHTML === "unmatched") {
      emptyPreEle.style.display = "none";
      // messageEle.appendChild(emptyPreEle);
    }
    messageEle.appendChild(preEle);

    if (className === "chatbot-message") {
      const messageContainer = document.createElement("div");
      messageContainer.classList.add("message-container");
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");
      const profilePhoto = document.createElement("img");
      profilePhoto.src = "./assets/logo.png"; // Replace 'path_to_chatbot_image' with the actual path of the chatbot's profile photo
      profilePhoto.classList.add("profile-photo");
      imageContainer.appendChild(profilePhoto);

      messageContainer.appendChild(imageContainer);
      messageContainer.appendChild(messageEle); // Appending messageEle directly
      messageContainer.style.display = "flex";
      chatBody.append(messageContainer);
    }
    if (className === "chatbot-message-image") {
      const messageContainer = document.createElement("div");
      messageContainer.classList.add("message-container");
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");
      const profilePhoto = document.createElement("img");
      profilePhoto.style.height = "0";
      // profilePhoto.src = "./assets/logo.png"; // Replace 'path_to_chatbot_image' with the actual path of the chatbot's profile photo
      profilePhoto.classList.add("profile-photo");
      imageContainer.appendChild(profilePhoto);

      messageContainer.appendChild(imageContainer);
      messageContainer.appendChild(messageEle); // Appending messageEle directly
      messageContainer.style.display = "flex";
      chatBody.append(messageContainer);
    }

    // const typed = new Typed(preEle, {
    //   strings: [modifiedContent],
    //   typeSpeed: 0.5,
    //   showCursor: false,
    //   onComplete: function () {
    //     setScrollPosition();
    //   },
    // });
    if (modifiedContent !== "matched" && modifiedContent !== "unmatched") {
      preEle.innerHTML = modifiedContent;
    } else {
      preEle.style.display = "none";
    }

    //If we have urls in the responsne
    if (content.urls.length > 0) {
      const regex = /https:\/\/www\.youtube\.com\/embed\/([\w-]+)/g;
      const matches = content.urls[0].url.match(regex);

      //If urls are youtube URLs
      if (matches) {
        RenderThumbsupdownContainer(messageEle); //adding thumbs up and down to the msgelement
        chatBody.appendChild(messageEle); //Adding translated response to the chatbody

        let yturls = [];
        content.urls.forEach((yturl) => {
          yturls.push(yturl.url);
        });

        //Rendering youtube msgs
        const ytmessagesEle = document.createElement("div");
        ytmessagesEle.className = "ytchatbot-message";
        const carousel = document.createElement("div");
        carousel.classList.add("ytcarousel");
        carousel.id = "dynamicCarousel";
        const prevButton = document.createElement("a");
        prevButton.classList.add("carousel-control-prev");
        prevButton.setAttribute("role", "button");
        prevButton.innerHTML =
          '<span class="material-symbols-outlined">arrow_back_ios_new</span><span class="sr-only">Previous</span>';

        if (yturls.length > 1) {
          carousel.appendChild(prevButton);
        } else {
          carousel.style.padding = "8px";
        }

        const carouselInner = document.createElement("div");
        carouselInner.classList.add("carousel-inner");

        // Inside the yturls.forEach loop
        yturls.forEach((link, index) => {
          const playerDiv = document.createElement("div");
          playerDiv.id = "player" + index; // Unique ID for each player container
          playerDiv.classList.add("iframe-container");

          const iframeContainer = document.createElement("div");
          iframeContainer.classList.add("responsive-video");
          playerDiv.appendChild(iframeContainer);
          const title = document.createElement("div");
          title.innerHTML = content.urls[index].filename;
          title.style.fontWeight = "bold";
          playerDiv.appendChild(title);

          const player = new YT.Player(iframeContainer, {
            videoId: extractVideoId(link),
            playerVars: { autoplay: 0 },
            events: {
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  if (currentVideoElement) {
                    // currentVideoElement.pauseVideo();
                  }
                  currentVideoElement = player;
                }
              },
            },
          });
          function extractVideoId(embedLink) {
            const regex = /\/embed\/([\w-]+)/;
            const match = embedLink.match(regex);
            if (match && match.length >= 2) {
              return match[1];
            }
            return null;
          }

          const carouselItem = document.createElement("div");
          carouselItem.classList.add("carousel-item");
          if (index === 0) {
            carouselItem.classList.add("active");
          }

          carouselItem.appendChild(playerDiv);
          carouselInner.appendChild(carouselItem);
        });

        carousel.appendChild(carouselInner);

        const nextButton = document.createElement("a");
        nextButton.classList.add("carousel-control-next");
        nextButton.setAttribute("role", "button");
        nextButton.innerHTML =
          '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward_ios</span><span class="sr-only">Next</span>';

        if (yturls.length > 1) {
          carousel.appendChild(nextButton);
        }

        ytmessagesEle.appendChild(carousel);

        RenderThumbsupdownContainer(ytmessagesEle);

        // Custom handling for next and prev button clicks
        let currentSlideIndex = 0;

        prevButton.addEventListener("click", () => {
          if (currentVideoElement) {
            currentVideoElement.pauseVideo();
          }
          currentSlideIndex = (currentSlideIndex - 1 + yturls.length) % yturls.length;
          updateActiveSlide();
        });

        nextButton.addEventListener("click", () => {
          if (currentVideoElement) {
            currentVideoElement.pauseVideo();
          }
          currentSlideIndex = (currentSlideIndex + 1) % yturls.length;
          updateActiveSlide();
        });

        function updateActiveSlide() {
          const items = carouselInner.querySelectorAll(".carousel-item");
          items.forEach((item, index) => {
            if (index === currentSlideIndex) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
        }
        chatBody.append(ytmessagesEle);
      }

      //If URLS are references appending references to msg
      else {
        const referencesToggle = document.createElement("span");
        if (content.detected_language === "es") {
          referencesToggle.textContent = "Referencias";
        } else {
          referencesToggle.textContent = "References";
        }
        referencesToggle.classList.add("references-toggle");

        const referencesCollapse = document.createElement("div");
        referencesCollapse.classList.add("references-collapse");

        const referencesDropdown = document.createElement("div");
        referencesDropdown.classList.add("references-dropdown");

        content.urls.forEach((pdf, index) => {
          const referenceLink = document.createElement("a");
          referenceLink.href = pdf.url;
          referenceLink.textContent = index + 1 + "." + " " + pdf.filename;
          referenceLink.classList.add("reference-link");
          referenceLink.target = "_blank";
          referencesDropdown.appendChild(referenceLink);
        });

        referencesCollapse.appendChild(referencesDropdown);

        referencesToggle.addEventListener("click", () => {
          referencesCollapse.classList.toggle("expanded");
        });

        const dropdownContainer = document.createElement("div");
        dropdownContainer.classList.add("dropdown");

        dropdownContainer.appendChild(referencesToggle);
        dropdownContainer.appendChild(referencesCollapse);

        messageEle.appendChild(dropdownContainer);

        RenderThumbsupdownContainer(messageEle); //Adding thumbsupdown to message

        chatBody.append(messageEle);
      }
    }
    if (className == "chatbot-message" && content.urls.length == 0) {
      // RenderThumbsupdownContainer(messageEle);
      // chatBody.append(messageEle);
    }
  } else if (type == "user") {
    const preelement = document.createElement("pre");
    preelement.textContent = content;
    messageEle.appendChild(preelement);
    chatBody.append(messageEle);
  }
};

const RenderThumbsupdownContainer = (messageEle) => {
  let thumbsUpIcon = document.createElement("i");
  thumbsUpIcon.classList.add("material-symbols-outlined", "thumbs-icon", "thumbscolor");
  thumbsUpIcon.id = "thumbupid";
  thumbsUpIcon.textContent = "thumb_up";
  thumbsUpIcon.addEventListener("click", () => {
    thumbsUpIcon.classList.toggle("thumbs-up-selected");
    thumbsDownIcon.classList.remove("thumbs-down-selected");
  });

  let thumbsDownIcon = document.createElement("i");
  thumbsDownIcon.classList.add("material-symbols-outlined", "thumbs-icon", "thumbscolor");
  thumbsDownIcon.id = "thumbdownid";
  thumbsDownIcon.textContent = "thumb_down";
  thumbsDownIcon.addEventListener("click", () => {
    thumbsDownIcon.classList.toggle("thumbs-down-selected");
    thumbsUpIcon.classList.remove("thumbs-up-selected");
  });

  let thumbsdiv = document.createElement("div");
  thumbsdiv.style.display = "flex";
  thumbsdiv.style.width = "100%";
  thumbsdiv.style.justifyContent = "flex-end";
  thumbsdiv.appendChild(thumbsUpIcon);
  thumbsdiv.appendChild(thumbsDownIcon);

  messageEle.appendChild(thumbsdiv);
};

function disableQuickButtons(buttons) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
    buttons[i].style.opacity = 0.6;
    buttons[i].style.cursor = "default";
  }
}
// function enableQuickButtons(buttons) {
//   for (let i = 0; i < buttons.length; i++) {
//     buttons[i].disabled = false;
//     buttons[i].style.opacity = 1;
//     buttons[i].style.cursor = "pointer";
//   }
// }

function enableQuickButtons(buttons) {
  let buttonsCount = buttons.length;
  for (let i = 0; i < buttonsCount; i++) {
    if (i >= buttonsCount - 3) {
      buttons[i].disabled = false;
      buttons[i].style.opacity = 1;
      buttons[i].style.cursor = "pointer";
    } else {
      buttons[i].disabled = true;
      buttons[i].style.opacity = 0.6;
      buttons[i].style.cursor = "default";
    }
  }
}

//rendering quick replies
const renderCards = (quick_replies) => {
  if (quick_replies !== undefined) {
    let flexdiv = document.createElement("div");
    flexdiv.style.width = "70%";
    flexdiv.style.fontSize = "14px";
    flexdiv.style.display = "flex";
    flexdiv.style.flexWrap = "wrap";
    flexdiv.style.margin = " 0 auto";

    quick_replies.forEach((ele) => {
      let buttonEle = document.createElement("button");
      buttonEle.classList.add("quickbtn");

      let txtNode = document.createTextNode(ele);
      buttonEle.append(txtNode);
      buttonEle.onclick = function () {
        let quickbtns = document.getElementsByClassName("quickbtn");
        disableQuickButtons(quickbtns);

        if (ele === "Select file") {
          handleImageUpload();
          if (!fileSelected) {
            enableQuickButtons(quickbtns);
          }
        } else if (ele === "Camera") {
          cameraClicked = true;
          myApp.startup();
          if (photoSent) {
            enableQuickButtons(quickbtns);
          }
        } else if (ele === "Delete Chat") {
          resetChat();
        } else if (ele === "Share Link") {
          navigator.clipboard.writeText("https://versante-frontend.azurewebsites.net/");
          // renderMessageEle("Link copied", "user");
        }
        if (ele !== "Select file" && ele !== "Camera" && ele && "Share Link") {
          renderMessageEle(ele, "user");
          setScrollPosition();
          renderChatbotResponse(ele);
        }
      };

      flexdiv.append(buttonEle);
    });
    chatBody.append(flexdiv);
  }
  setScrollPosition();
};





// For Rendering the carousel cards.
const renderCarouselCards = (cardData) => {
  let wrapper = document.createElement("div");
  wrapper.classList.add("wrapper");
  let carousel = document.createElement("div");
  carousel.classList.add("carousel");

  cardData.forEach((item) => {
    // if(item.description.contains('more')){
    //   item.description=item.description.replace('more','');
    // }
    // const stringWithoutAnchors = removeAnchorTagsFromString(item.description);
    // item.description = stringWithoutAnchors;

    const cardItem = document.createElement("div");
    cardItem.className = "cardItem";

    // Thumbnail Image

    if (item.videoLink && item.videoLink.includes("youtube.com")) {
      // Create an iframe element for YouTube video
      const videoId = extractYouTubeId(item.videoLink);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      const contentElement = document.createElement("iframe");
      contentElement.src = embedUrl;
      contentElement.allowFullscreen = true;
      contentElement.classList.add("youtube-video");
      contentElement.style.height = "100px";
      cardItem.appendChild(contentElement);
    } else {
      // If no valid video link, create a placeholder element (e.g., image)
      const thumbnail = document.createElement("img");
      thumbnail.src = item.thumbnail; // Use the provided thumbnail URL
      thumbnail.alt = "Thumbnail";
      thumbnail.classList.add("thumbnail");
      thumbnail.style.height = "100px";
      cardItem.appendChild(thumbnail);
    }

    const cardInnerContainer = document.createElement("div");
    cardInnerContainer.classList.add("cardInnerContainer");
    cardInnerContainer.style.padding = "10px";
    cardInnerContainer.style.borderBottom = "0.116px solid black";

    cardItem.appendChild(cardInnerContainer);

    const title = document.createElement("h3");
    title.innerHTML = item.title; // Use the provided title
    title.classList.add("title");
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    // title.style.whiteSpace = "nowrap";
    title.style.wordWrap = "break-word"; // Adding word-wrap for additional support

    // Add a maximum width to the title to prevent it from overflowing
    title.style.maxWidth = "100%";
    cardInnerContainer.appendChild(title);

    const resource = document.createElement("div");
    resource.classList.add("resource");
    resource.innerHTML = "Resource";
    resource.style.fontSize = "8px";
    resource.style.color = "#757575";
    resource.style.padding = "2px 0";
    cardInnerContainer.appendChild(resource);

    const description = document.createElement("p");
    description.innerHTML = item.description;
    description.classList.add("description");
    description.style.overflow = "hidden";
    description.style.textOverflow = "ellipsis";
    description.style.whiteSpace = "nowrap";
    description.style.wordWrap = "break-word"; // Adding word-wrap for additional support

    // Add a maximum width to the description to prevent it from overflowing
    description.style.maxWidth = "100%";
    cardInnerContainer.appendChild(description);

    // Link
    const linkContainer = document.createElement("div");
    linkContainer.style.display = "flex";
    linkContainer.style.alignItems = "center";
    const spanIcon = document.createElement("span");
    spanIcon.style.padding = "10px";
    spanIcon.style.fontSize = "18px";
    spanIcon.style.color = "#007bff";

    spanIcon.classList.add("material-symbols-outlined");
    spanIcon.textContent = "display_external_input"; // Add the text content or inner HTML as needed

    linkContainer.appendChild(spanIcon);
    const link = document.createElement("a");
    link.href = item.link;
    link.target = "_blank";
    link.innerHTML = "Read more";
    link.style.fontSize = "13px";

    link.classList.add("link");
    link.id = "cardLink";
    // link.style.borderTop="0.116px solid black"
    link.style.width = "100%";
    // link.style.padding = "10px";
    link.style.textDecoration = "underline";
    linkContainer.appendChild(link);
    cardItem.appendChild(linkContainer);
    carousel.appendChild(cardItem);
  });

  wrapper.appendChild(carousel);
  chatBody.appendChild(wrapper);

  $(function () {
    $(".carousel").not(".slick-initialized").slick({
      slidesToShow: 2,
      centerMode: true,
      slidesToScroll: 1,
      variableWidth: true,
      prevArrow: null,
      nextArrow: null,
      // dots: true,
      // infinite: true,
    });
    // removeSlideFromLeft()
  });

  chatBody.appendChild(wrapper);
};

function removeSlideFromLeft() {
  const slickCarousel = $(".carousel");

  // Check if there are slides available to remove
  if (slickCarousel && slickCarousel.slick("getSlick").slideCount > 0) {
    // Remove the first slide (from the left side)
    slickCarousel.slick("slickRemove", 0);
  }
}

//Initial call

async function getConversationIdresponse() {
  const response = await fetch("https://directline.botframework.com/v3/directline/conversations", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer NyMlvCwe_i8.8lTnKqtAI_HbcqdT1haoEfLRjZRMBSe9G0nNDiRnj_Y",
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const jsonData = await response.json();
  return jsonData;
}

async function getConversationId() {
  enableInput();
  showLoadingAnimation();
  showLoadingAnimationinsend();
  const resp = await getConversationIdresponse();
  disableInput();
  localStorage.setItem("conversation_id", resp.conversationId);
  chatBody.removeChild(chatBody.lastChild);

  enableInput();
  renderMessageEle({
    translated_response: `Thank you for your interest in \"<b>Chance Assessment</b>\". You are one step away from taking charge of your oral, mental, and sexual health awareness. <b>\r\nThis will take 2-3 mins of your time.</b>\r\n\r\n <b>DISCLAIMER</b>: The result of this test will remain confidential and anonymous.\r\nThose will not be shared with anyone unless you wish to consult your provider. You also have the option to <b>delete this chat</b> once you receive your "Chance score". \r\n\r\nRetake the assessment <b>anytime and anywhere!</b>`,
    urls: [],
  });
  renderCards(["Opt In", "Opt Out", "Know more"]);

  return resp;
}

let direct_line_secret = "NyMlvCwe_i8.8lTnKqtAI_HbcqdT1haoEfLRjZRMBSe9G0nNDiRnj_Y";
let base_url = "https://directline.botframework.com/v3/directline";

//Api call for usermessages

async function uploadImge(message) {}
async function Postresponse(url, data, headers) {
  const response = await fetch(url, {
    method: "POST",
    // mode: "cors",
    headers: headers,
    body: JSON.stringify({ ...data }),
  });
  if (!response.ok) {
    const loadingContainer = chatBody.querySelector(".loading-container");
    chatBody.removeChild(loadingContainer);
    enableInput();

    renderMessageEle({
      translated_response: "I'm sorry there was an error with the Bot Response, please try again.",
      urls: [],
    });
  }
  return response;
}
async function Getresponse(url, data, headers) {
  const response = await fetch(url, {
    method: "GET",
    headers: headers,
  });
  if (!response.ok) {
    const loadingContainer = chatBody.querySelector(".loading-container");
    chatBody.removeChild(loadingContainer);
    enableInput();

    renderMessageEle({
      translated_response: "I'm sorry there was an error with the Bot Response, please try again.",
      urls: [],
    });
  }
  return response;
}

const response = async (url, data, headers) => {
  let PostData = await Postresponse(url, data, headers);
  let getData = await Getresponse(url, data, headers);
  let responseData = await getData.json();
  return responseData;
};

async function getChatbotResponse(userInput) {
  let conversation_id = localStorage.getItem("conversation_id");
  let base_url = "https://directline.botframework.com/v3/directline";
  let url = `${base_url}/conversations/${conversation_id}/activities`;

  let headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${direct_line_secret}`,
  };
  let data = {
    type: "message",
    from: { id: conversation_id },
    text: userInput,
  };

  if (userInput.type == "message" && userInput?.attachments !== null) {
    data = userInput;
  }

  const resp = await response(url, data, headers);

  if (userInput !== undefined) {
    let userobj = { role: "user", content: userInput };
    let responseobj = { role: "assistant", content: resp.translated_response };
    chatHistory.push(userobj, responseobj, headers);
  }
  if (chatHistory.length > 6) {
    chatHistory.splice(0, 2);
  }
  return resp;
}

async function getChatbotAudioResponse(userInput) {
  let url = "url_for_audio_response";
  //let url = "http://127.0.0.1:5000"
  url = url + "/speech_to_text";

  const data = userInput;

  const resp = await audioresponse(url, data);

  return resp;
}

//Scroll when msg is being added
const setScrollPosition = () => {
  if (chatBody.scrollHeight > 0) {
    chatBody.scrollTop = chatBody.scrollHeight;
  }
};

//Triggers when user clicks on send icon
sendIcon.addEventListener("click", () => {
  renderUserMessage();
});

//Triggers when user enters any thing
inputField.addEventListener("input", () => {
  disableInput();
  if (currentAudioSource != null) {
    currentAudioSource.stop();
  }
  if (inputField.value.trim() === "") {
    translate.style.display = "inline";
    sendIcon.style.display = "none";
  } else {
    translate.style.display = "none";
    sendIcon.style.display = "inline";
  }
});
disableInput();

// inputField.addEventListener("click", () => {
//   translateText("disable");
// });

//Audio recording handling
translate.addEventListener("click", () => {
  if (!isRecording) {
    translateText();
  } else {
    stopRecording();
  }
});

inputClickableDiv.addEventListener("click", (event) => {
  translateText("disable");
});

function translateText(type) {
  if (type === "disable") {
    renderMessageEle({
      translated_response: `<span><b>DISCLAIMER</b></span>: This is a <b>beta version</b>, and we've got some interesting features coming in the full version! <i>(Like, in the future, you'll be able to ask/chat <b>like you're talking to a secret keeper buddy</b>, using your own words and language.)</i>`,
      urls: [],
    });
    setScrollPosition();
  } else {
    renderMessageEle({
      translated_response: `<span ><b>DISCLAIMER</b></span>: This is a <b>beta version</b>, and we have got some interesting features coming in the full version. <i>(In the future, you'll be able to ask/chat <b> like you're talking to a secret keeper buddy</b>, using your own words and language.)</i>
        <br><span 
  text-transform: uppercase;"> <b> Descargo de responsabilidad</b></span>: ¡Esta es una <b>versión beta</b> y tenemos algunas características interesantes en la versión completa! <i> (En el futuro, podrás preguntar/chatear <b>como si estuvieras hablando con un amigo guardián del secreto</b>, usando tus propias palabras y lenguaje).</i>`,
      urls: [],
    });
    setScrollPosition();
  }
}


function stopRecording() {
  isRecording = false;
  // senddiv.removeChild(translate)

  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

async function convertToWav() {
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

  await getChatbotAudioResponse(audioBlob);
}

//Triggers when user clicks on Chaticon
// chatIcon.addEventListener("click", () => {
//   chatContainer.style.display = "flex";
//   chatContainer.style.flexDirection = "column";
//   chatIcon.style.display = "none";
// });
// Define a function to toggle the chat display
function toggleChatDisplay() {
  chatContainer.style.display = "flex";
  chatContainer.style.flexDirection = "column";
  chatIcon.style.display = "none";
}

// Call the function on page load
window.addEventListener("load", toggleChatDisplay);

// Add click event listener to chatIcon
chatIcon.addEventListener("click", toggleChatDisplay);

minimizeChatButton.addEventListener("click", toggleChatMinimized); //Mininimizing the chat

function toggleChatMinimized() {
  chatContainer.style.display = "none";
  chatIcon.style.display = "flex";
}

circleChatIcon.addEventListener("click", resetChat); //Callin resetting the chat
//Resetting the chat
function resetChat() {
  chatBody.innerHTML = "";
  location.reload();
  chatContainer.style.display = "flex";

  // getConversationId();
}

//chatloading animation
function showLoadingAnimation(type) {
  const loadingContainer = document.createElement("div");
  if (type != "user-audio") {
    loadingContainer.classList.add("loading-container");
  } else {
    loadingContainer.classList.add("user-loading-container");
  }

  const bouncingBalls = document.createElement("div");
  bouncingBalls.classList.add("bouncing-balls");

  for (let i = 0; i < 3; i++) {
    const ball = document.createElement("div");
    if (type != "user-audio") {
      ball.classList.add("ball");
    } else {
      ball.classList.add("user-ball");
    }
    bouncingBalls.appendChild(ball);
  }

  // loadingContainer.appendChild(bouncingBalls);

  chatBody.appendChild(loadingContainer);
  setScrollPosition();
}

//Loading animation on send icon
function showLoadingAnimationinsend(type) {
  const loadingContainer = document.createElement("div");

  loadingContainer.classList.add("send-loading-container");
  loadingContainer.id = "send-loading-container";

  const bouncingBalls = document.createElement("div");
  bouncingBalls.classList.add("bouncing-balls");

  for (let i = 0; i < 3; i++) {
    const ball = document.createElement("div");
    ball.classList.add("send-ball");

    bouncingBalls.appendChild(ball);
  }

  // loadingContainer.appendChild(bouncingBalls);

  // senddiv.appendChild(loadingContainer);
  senddiv.style.backgroundColor = "transparent";
  setScrollPosition();
}

//Disables whenever any api calls happens (e.g.; disable enter key code from input field and disable quickreply button click).
function disableInput() {
  document.getElementById("txtInput").addEventListener("keypress", function (e) {
    if (e.keyCode == 13) {
      return false;
    }
  });
  senddiv.removeChild(translate);
  senddiv.removeChild(sendIcon);
  let quickbtns = document.getElementsByClassName("quickbtn");
  for (let i = 0; i < quickbtns.length; i++) {
    quickbtns[i].disabled = true;
    quickbtns[i].style.opacity = 0.6;
  }
}

//Enables input elements like enter key and quick reply buttons after API calls complete. Which were disabled by disableInput()
function enableInput() {
  document.getElementById("txtInput").addEventListener("keypress", function (e) {
    if (e.keyCode == 13) {
      return true;
    }
  });
  // let quickbtns = document.getElementsByClassName("quickbtn");
  // for (let i = 0; i < quickbtns.length; i++) {
  //   quickbtns[i].disabled = false;
  //   quickbtns[i].style.opacity = 1;
  // }

  if (senddiv.querySelector("#send-loading-container")) {
    senddiv.removeChild(document.getElementById("send-loading-container"));
    // senddiv.style.backgroundColor = "var(--chatbot-primary-color)";
  }
  senddiv.appendChild(sendIcon);
  senddiv.appendChild(translate);
  translate.textContent = "translate";
  sendIcon.style.display = "none";
  translate.style.display = "inline";
}




