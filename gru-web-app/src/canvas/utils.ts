import inferr from "../classify"
import MSER from "../mser/mser"
import * as tf from '@tensorflow/tfjs'

let model: tf.LayersModel
(async () => {
    model = await inferr()
})()

let mser = new MSER({
    delta: 100, // Delta parameter of the MSER algorithm
    minArea: 0.0001, // Minimum area of any stable region relative to the image domain area
    maxArea: 0.5, // Maximum area of any stable region relative to the image domain area
    maxVariation: 0.5, // Maximum variation (absolute stability score) of the regions
    minDiversity: 0.33 // Minimum diversity of the regions
})

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

function centerCanvas(canvas: HTMLCanvasElement, boundingBox?: BoundingBox): HTMLCanvasElement {
    if(!boundingBox) {
        boundingBox = getBoundingBox(canvas)
    }

    let {upperLeft, lowerRight} = boundingBox


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

function img2GreyScaleMatrix(imageData: ImageData, width: number): GreyScaleImageMatrix {
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

        if(row.length == width) {
            imgGreyScaleMatrix.push(row)
            row = []
        }

    }

    return imgGreyScaleMatrix
}

function img2GreyScale(imdata: ImageData): ImageData {
    for (var i=0;i<imdata.data.length;i+=4){
        if(imdata.data[i+3] == 0){
            imdata.data[i]=255;
            imdata.data[i+1]=255;
            imdata.data[i+2]=255;
            imdata.data[i+3]=255;
        } else {
            imdata.data[i]=0
            imdata.data[i+1]=0
            imdata.data[i+2]=0
            imdata.data[i+3] = 255
            // row.push(imageData.data[i+3])
        }
    }
    return imdata
}

function canvas2Num(origCanvas: HTMLCanvasElement, newWidth: number, newHeight: number) {
    return new Promise<{
        img: string,
        prediction: number,
        boundingBoxes: BoundingBox[]
    }>((resolve, reject) => {

        // let boundingBox = getBoundingBox(origCanvas)

        let base64 = origCanvas.toDataURL()

        let canvas = document.createElement("canvas") as HTMLCanvasElement
        if(!canvas) reject("Canvas failed to initialize")

        canvas.width = 28
        canvas.height = 28

        let context = canvas.getContext("2d") as CanvasRenderingContext2D
        let origContext = origCanvas.getContext("2d") as CanvasRenderingContext2D
        let img = document.createElement("img")
        img.src = base64
        img.onload = () => {
            // console.log({img})
            let imdata = origContext.getImageData(0, 0, origCanvas.width, origCanvas.height)
            img2GreyScale(imdata)
            let regions = mser.extract(imdata).map((region: any) => region.rect)
                            // merge overlapping
            // var intersection;
            // for (var i = regions.length-1; i >= 0; i--) {
            //         for (var j = i-1; j >= 0; j--) {
            //                 intersection = regions[j].intersect(regions[i]);
            //                 if(intersection && (intersection.size > 0.5 * regions[j].size || intersection.size > 0.5 * regions[i].size)) {
            //                         regions[j].merge(regions[i]);
            //                         regions.splice(i, 1);
            //                         break;
            //                 }
            //         }
            // }
            // console.log(regions)
            // origContext.strokeStyle = "red";
            // origContext.lineWidth = 0.8;
            // regions.forEach( region => {
            //         origContext.strokeRect(region.left, region.top, region.width, region.height);
            // });
            // origContext.stroke();

            let imageData: ImageData
            let imgGreyScaleMatrix

            // let num = ""
            context.scale(newWidth/img.width,  newHeight/img.height)
            let predictions: any = []
            let boundingBoxes: BoundingBox[] = []
            regions.forEach((region: any) => {
                let boundingBox = {
                    upperLeft: {
                        x: region.left,
                        y: region.top
                    },
                    lowerRight: {
                        x: region.left + region.width,
                        y: region.top + region.height
                    }
                }

                boundingBoxes.push(boundingBox)
                context.clearRect(0, 0, 500, 500)
                context.drawImage(centerCanvas(origCanvas, boundingBox), 0, 0)
                imageData = context.getImageData(0, 0, newWidth, newHeight)
                imgGreyScaleMatrix = img2GreyScaleMatrix(imageData, newWidth)
                let imgGrey = imgGreyScaleMatrix.map((l: number[]) => l.map((el: number) => [el]))
                let prediction = model.predict(tf.tensor([imgGrey], [1, 28, 28, 1])) as tf.Tensor
                predictions.push({
                    prediction: prediction.dataSync().indexOf(1),
                    left: region.left
                })

                context.putImageData(imageData,0,0)
            });

            predictions.sort((a: any, b: any) => a.left - b.left)

            let prediction = parseInt(predictions.reduce((acc: string, val: any) => acc + (val.prediction > 0 ? val.prediction : ""), ""))

            console.log("Number " + prediction)
            // regions.forEach(rect => {


            // console.log('imgGreyScaleMatrix')
            // console.log(imgGreyScaleMatrix)
            // });

            resolve({
                img:canvas.toDataURL(),
                boundingBoxes: boundingBoxes,
                prediction: prediction
            })
        }

        img.onerror = reject
    })
}

export default canvas2Num