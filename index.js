"use strict";

// https://en.wikipedia.org/wiki/Wikipedia:Non-free_content#Image_resolution
const MAX_MEGAPIXELS = 100000;

/*** DOM ELEMENTS ***/
let firefoxNote = document.querySelector("#firefoxNote");
let activateCanvasPermissionPopup = document.querySelector("#activateCanvasPermissionPopup");

let errorBox = document.querySelector("#errorBox");
let errorPre = document.querySelector("#errorPre");

let imageInput = document.querySelector("[name=imageInput]");
let downloadDestinationImage = document.querySelector("#downloadDestinationImage");
let sourceImageMetadata = document.querySelector("#sourceImageMetadata");
let destinationImageMetadata = document.querySelector("#destinationImageMetadata");
let destinationImage = document.querySelector("#destinationImage");

/*** ERROR HANDLER ***/
function handleError(error) {
    let text = `${error.name}: ${error.message}`;
    if (error.stack) {
        text += `\n${error.stack}`;
    }

    if (errorPre.innerText) {
        errorPre.innerText += "\n---\n";
    }
    errorPre.innerText += text;

    errorBox.classList.remove("hide");
    throw error;
}

/*** FUNCTIONS ***/
function initiateDownload() {
    let a = document.createElement("a");
    a.download = "Downscaled - " + imageInput.files[0].name.replace(/\.\w{3,4}$/, "") + ".png";
    a.href = destinationImage.toDataURL();
    a.click();
}

function handleImageInImageInput(autoDownload) {
    createImageBitmap(imageInput.files[0]).then((image) => {
        sourceImageMetadata.innerText = `Source image resolution: ${image.width}x${image.height}`;
        if (image.width * image.height <= MAX_MEGAPIXELS) {
            destinationImageMetadata.innerText = "No downscale necessary, source image meets resolution requirements";
            destinationImage.getContext("2d").reset();
            downloadDestinationImage.disabled = true;
            return;
        }

        // https://en.wikipedia.org/wiki/Wikipedia:Non-free_content#Image_resolution
        let newWidth = Math.trunc(Math.sqrt(MAX_MEGAPIXELS * image.width / image.height));
        let newHeight = Math.trunc(image.height * newWidth / image.width);

        return createImageBitmap(imageInput.files[0], {
            resizeWidth: newWidth,
            resizeHeight: newHeight,
            resizeQuality: "high",
        });
    }).then((image) => {
        if (!image) {
            return;
        }

        destinationImageMetadata.innerText = `Downscaled image resolution: ${image.width}x${image.height}`;

        destinationImage.width = image.width;
        destinationImage.height = image.height;
        destinationImage.getContext("2d").drawImage(image, 0, 0);

        downloadDestinationImage.disabled = false;
        if (autoDownload) {
            initiateDownload();
        }
    }).catch((error) => {
        handleError(error);
    });
}

/*** DOM EVENT LISTENERS ***/
if (navigator.userAgent.includes("Firefox/")) {
    firefoxNote.classList.remove("hide");
}
activateCanvasPermissionPopup.addEventListener("click", () => {
    try {
        document.createElement("canvas").toDataURL();
    } catch (error) {
        handleError(error);
    }
});

imageInput.disabled = false;
imageInput.addEventListener("change", () => {
    try {
        handleImageInImageInput(true);
    } catch (error) {
        handleError(error);
    }
});
// When the page is refreshed with an image loaded, that image will be prefilled in the input element,
// but the image isn't downscaled
if (imageInput.value) {
    try {
        handleImageInImageInput(false);
    } catch (error) {
        handleError(error);
    }
}

downloadDestinationImage.addEventListener("click", () => {
    try {
        initiateDownload();
    } catch (error) {
        handleError(error);
    }
});
