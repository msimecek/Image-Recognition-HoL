//@ts-check

(function () {
    // The width and height of the captured photo. We will set the
    // width to the value defined here, but the height will be
    // calculated based on the aspect ratio of the input stream.

    var width = 320;    // We will scale the photo width to this
    var height = 0;     // This will be computed based on the input stream

    // |streaming| indicates whether or not we're currently streaming
    // video from the camera. Obviously, we start at false.

    var streaming = false;

    // The various HTML elements we need to configure or control. These
    // will be set by the startup() function.

    var video = null;
    var canvas = null;
    var photo = null;
    
    var groupIdInput = null;
    var personIdInput = null;

    var capturedImage = null;

    function startup() {
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        photo = document.getElementById('photo');
        
        groupIdInput = document.getElementById('groupId');
        personIdInput = document.getElementById('personId');

        groupIdInput.value = getCookie("groupId");
        personIdInput.value = getCookie("personId");

        // Camera capture related stuff
        navigator.getMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

        navigator.getMedia(
            {
                video: true,
                audio: false
            },
            function (stream) {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    var vendorURL = window.URL || window.webkitURL;
                    video.src = vendorURL.createObjectURL(stream);
                }
                video.play();
            },
            function (err) {
                console.log("An error occured! " + err);
            }
        );

        video.addEventListener('canplay', function (ev) {
            if (!streaming) {
                height = video.videoHeight / (video.videoWidth / width);

                // Firefox currently has a bug where the height can't be read from
                // the video, so we will make assumptions if this happens.

                if (isNaN(height)) {
                    height = width / (4 / 3);
                }

                video.setAttribute('width', width);
                video.setAttribute('height', height);
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                streaming = true;
            }
        }, false);

        // Click handlers
        document.getElementById('createGroupButton').addEventListener('click', createGroup);
        document.getElementById('createPersonButton').addEventListener('click', createPerson);
        document.getElementById('trainButton').addEventListener('click', trainGroup);

        document.getElementById('addFaceButton').addEventListener('click', function (ev) {
            takepicture();
            addFace();
            ev.preventDefault();
        }, false);

        document.getElementById('identifyButton').addEventListener('click', function (ev) {
            takepicture();
            identifyFace();
            ev.preventDefault();
        }, false);

        clearphoto();
    }

    // Fill the photo with an indication that none has been
    // captured.

    function clearphoto() {
        var context = canvas.getContext('2d');
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);

        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
    }

    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.

    function takepicture() {
        var context = canvas.getContext('2d');
        if (width && height) {
            canvas.width = width;
            canvas.height = height;
            context.drawImage(video, 0, 0, width, height);

            //var data = canvas.toDataURL('image/png');
            capturedImage = canvas.toDataURL('image/png');
            photo.setAttribute('src', capturedImage);
        } else {
            clearphoto();
        }
    }

    function createGroup() {
        var groupId = groupIdInput.value;
        if (groupId === "") {
            alert("Please provide the group name.");
            return;
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                document.cookie = "groupId=" + groupId;
            }
        };

        xhttp.open("POST", "http://localhost:5000/api/group/", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send('"' + groupId + '"');
    }

    function createPerson() {
        var personName = document.getElementById("personName").value;
        var groupId = groupIdInput.value;

        if (personName === "" || groupId === "") {
            alert("Please provide both Group ID and Person Name.");
            return;
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                var personId = this.responseText.replace(/"/g, '');
                document.cookie = "personId=" + personId;
                personIdInput.value = personId;
            }
        };

        xhttp.open("POST", "http://localhost:5000/api/group/" + groupId + "/person", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send('"' + personName + '"');
    }


    function trainGroup() {
        var groupId = groupIdInput.value;
        if (groupId === "") {
            alert("Please fill in the group name.");
            return;
        }

        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "http://localhost:5000/api/group/" + groupId + "/train", true);
        xhttp.send();
    }

    function addFace() {
        var groupId = document.getElementById("groupId").value;
        var personId = document.getElementById("personId").value;

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                document.getElementById("response").innerHTML = this.responseText; // Face ID
            }
        };

        xhttp.open("POST", "http://localhost:5000/api/group/" + groupId + "/person/" + personId + "/faces", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send('"' + capturedImage + '"');
    }

    function identifyFace() {
        var groupId = document.getElementById("groupId").value;

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                document.getElementById("response").innerHTML = this.responseText;
            }
        };

        xhttp.open("POST", "http://localhost:5000/api/group/" + groupId + "/identify", true);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send('"' + capturedImage + '"');
    }

    // Set up our event listener to run the startup process
    // once loading is complete.
    window.addEventListener('load', startup, false);
})();

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}