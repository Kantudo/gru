import Canvas from "./Canvas"

type GreyScaleImageMatrix = Array<Array<number>>

type Point = {
    x: number,
    y: number
}

type BoundingBox = {
    upperLeft: Point,
    lowerRight: Point
}

function getBoundingBox(canvas: HTMLCanvasElement): BoundingBox {
    let context = canvas.getContext("2d")

    if(!context) throw "Could not get context"

    let imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    let currentPixel = {
        x: 0,
        y: 0
    } as Point

    let upperLeft = {...currentPixel}
    let lowerRight = {...currentPixel}

    for (var i=0;i<imageData.data.length;i+=4){

        if(imageData.data[i+3] !== 0) {
            if(currentPixel.x <= upperLeft.x || upperLeft.x == 0) {
                upperLeft.x = currentPixel.x
            }
            if(currentPixel.y <= upperLeft.y || upperLeft.y == 0) {
                upperLeft.y = currentPixel.y
            }
            if(currentPixel.x >= lowerRight.x || lowerRight.x == 0) {
                lowerRight.x = currentPixel.x
            }
            if(currentPixel.y >= lowerRight.y || lowerRight.y == 0) {
                lowerRight.y = currentPixel.y
            }
        }

        currentPixel.x +=1

        if(currentPixel.x == canvas.width) {
            currentPixel.x = 0
            currentPixel.y += 1
        }

    }

    return {
        upperLeft,
        lowerRight,
    } as BoundingBox
}

function centerCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    let {upperLeft, lowerRight} = getBoundingBox(canvas)

    let newCanvas = document.createElement("canvas")
    let newContext = newCanvas.getContext("2d")

    if(!newContext) throw "Could not get context"

    newCanvas.width = 500
    newCanvas.height = 500

    let width = lowerRight.x-upperLeft.x
    let height = lowerRight.y-upperLeft.y

    let ratio = width/height

    if(width > height) {
        width = 300
        height =width/ratio
    } else {
        height = 300
        width = height*ratio
    }

    newContext.drawImage(canvas,
        upperLeft.x,
        upperLeft.y,
        lowerRight.x-upperLeft.x,
        lowerRight.y-upperLeft.y,
        250-(width)/2,
        250-(height)/2,
        width,
        height
    )

    return newCanvas
}

function greyScaleResizeBase64Img(origCanvas: HTMLCanvasElement, newWidth: number, newHeight: number) {
    return new Promise<{
        img: string
        imgGreyScaleMatrix: GreyScaleImageMatrix,
        boundingBox: BoundingBox
    }>((resolve, reject) => {

        let boundingBox = getBoundingBox(origCanvas)

        let base64 = origCanvas.toDataURL()

        let canvas = document.createElement("canvas")
        if(!canvas) reject("Canvas failed to initialize")

        canvas.width = 28
        canvas.height = 28

        let context = canvas.getContext("2d")
        let img = document.createElement("img")
        img.src = base64
        img.onload = () => {
            if(context === null) {
                reject("Context failed to initialize")
                return
            }
            // console.log({img})

            context.scale(newWidth/img.width,  newHeight/img.height)
            context.drawImage(centerCanvas(origCanvas), 0, 0)

            let imageData = context.getImageData(0, 0, newWidth, newHeight)

            let imgGreyScaleMatrix = []
            let row = []
            for (var i=0;i<imageData.data.length;i+=4){

                if(imageData.data[i+3]==0){

                    imageData.data[i]=0;
                    imageData.data[i+1]=0;
                    imageData.data[i+2]=0;
                    imageData.data[i+3]=255;

                    row.push(0)
                } else {
                    imageData.data[i]=255
                    imageData.data[i+1]=255
                    imageData.data[i+2]=255
                    row.push(imageData.data[i+3] == 255 ? 255 : 0)
                    // row.push(imageData.data[i+3])
                }

                if(row.length == newWidth) {
                    imgGreyScaleMatrix.push(row)
                    row = []
                }

            }
            context.putImageData(imageData,0,0);

            // document.body.appendChild(centerCanvas(origCanvas))

            // console.log({
            //     width: canvas.width,
            //     height: canvas.height
            // })

            resolve({
                img:canvas.toDataURL(),
                imgGreyScaleMatrix: imgGreyScaleMatrix,
                boundingBox: boundingBox
            })
        }
    })
}

export default {
    greyScaleResizeBase64Img
}