import './index.css'
import React from 'react'

import axios from 'axios'

import a from './utils'
let greyScaleResizeBase64Img = a.greyScaleResizeBase64Img

interface Point {
    x: number,
    y: number
}

class Canvas extends React.Component {
    canvasRef: React.RefObject<HTMLCanvasElement>
    imgRef: React.RefObject<HTMLImageElement>
    canvas: HTMLCanvasElement | null
    canvasBoundingRect: ClientRect | null
    context: CanvasRenderingContext2D | null
    state: {
        pen: {
            color: string,
            size: number
        },
        pts: Array<Point>,
        isDown: boolean,
        guess: string
    }
    canvas2: HTMLCanvasElement | undefined
    context2: CanvasRenderingContext2D | null | undefined

    constructor(props: any) {
        super(props)

        this.state = {
            pen: {
                color: "#ff7f90",//"#34c3eb",
                size: 30
            },
            pts: [],
            isDown: false,
            guess: ''
        }

        this.canvasRef = React.createRef<HTMLCanvasElement>()
        this.imgRef = React.createRef<HTMLImageElement>()
        this.canvas = null
        this.context = null

        this.canvasBoundingRect = null

        this.drawPoints = this.drawPoints.bind(this)
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)
        this.onTouchMove = this.onTouchMove.bind(this)
        this.onTouchStart = this.onTouchStart.bind(this)
        this.onTouchEnd = this.onTouchEnd.bind(this)
        this.getContext = this.getContext.bind(this)
        this.clear = this.clear.bind(this)
        this.updateImg = this.updateImg.bind(this)
        this.getEventRelativeCoordinates = this.getEventRelativeCoordinates.bind(this)
        this.handleResize = this.handleResize.bind(this)
    }

    getContext() {
        if (!this.canvasRef.current) return
        this.canvas = this.canvasRef.current
        this.canvas2 = document.createElement('canvas')
        this.context2 = this.canvas2?.getContext('2d') ?? null
        this.context = this.canvas?.getContext('2d') ?? null
        if(this.canvas) {
            this.canvasBoundingRect = this.canvas.getBoundingClientRect()

            this.canvas2.width = this.canvas.clientWidth
            this.canvas2.height = this.canvas.clientHeight
        }
    }

    componentDidMount() {
        this.getContext()
        window.addEventListener('resize', this.handleResize)
    }
    componentDidUpdate() {
        if(this.canvas2 && this.context2 && this.canvas) {
            let aux: HTMLCanvasElement = this.canvas2
            this.getContext()
            this.context2.drawImage(aux, 0, 0, this.canvas.width, this.canvas.height)
        }
    }

    handleResize() {
        this.componentDidUpdate()
    }

    clear() {
        this.context && this.canvas && this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context2 && this.canvas2 && this.context2.clearRect(0, 0, this.canvas2.width, this.canvas2.height)
    }

    updateImg() {
        if(this.canvas) {

            greyScaleResizeBase64Img(this.canvas, 28, 28).then(({img, imgGreyScaleMatrix, boundingBox})=>{

                this.imgRef.current && (this.imgRef.current.src = img)

                axios.post('http://localhost:8080/img',{img:imgGreyScaleMatrix}).then((resp) => {
                    // console.log(`Guess: ${resp.data.guess}`)
                    this.setState({guess: resp.data.guess.toString()})
                })

                if (!this.context) return null

                let {upperLeft, lowerRight} = boundingBox

                // this.context.lineWidth = 3;
                // this.context.strokeStyle = "red";
                // this.context.beginPath();
                // this.context.rect(upperLeft.x,
                //             upperLeft.y,
                //             lowerRight.x-upperLeft.x,
                //             lowerRight.y-upperLeft.y)
                // this.context.stroke();
            })

        }
    }

    onMouseDown(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        ev.preventDefault()
        this.state.isDown = true
        this.state.pts.push(this.getEventRelativeCoordinates(ev) as Point)
        this.drawPoints()
    }

    onTouchStart(ev: React.TouchEvent<HTMLCanvasElement>) {
        // ev.preventDefault()
        this.state.isDown = true
        let points = this.getEventRelativeCoordinates(ev) as Point[]
        points.forEach(point => {
            this.state.pts.push(point)
        })
        this.drawPoints()
    }

    onMouseUp(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        ev.preventDefault()
        this.state.isDown = false

        this.context2 && this.canvas && this.context2.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context2 && this.canvas && this.context2.drawImage(this.canvas, 0, 0)
        this.setState({pts: []})

        this.updateImg()
    }

    onTouchEnd(ev: React.TouchEvent<HTMLCanvasElement>) {
        // ev.preventDefault()
        this.state.isDown = false

        this.context2 && this.canvas && this.context2.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context2 && this.canvas && this.context2.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height)
        this.setState({pts: []})

        this.updateImg()
    }

    onMouseMove(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        ev.preventDefault()

        if(!this.state.isDown || !this.context || !this.canvas) return
        // console.log(this.context)
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
        // I dont need in memory canvas
        this.canvas2 && this.context.drawImage(this.canvas2, 0, 0); // Draw to inmemory cvs2
        this.state.pts.push(this.getEventRelativeCoordinates(ev) as Point);
        this.drawPoints()
    }

    onTouchMove(ev: React.TouchEvent<HTMLCanvasElement>) {
        // ev.preventDefault()
        // console.log(this.context)

        let coords = this.getEventRelativeCoordinates(ev) as Point[]

        (coords).forEach(point => {
            if(!this.state.isDown || !this.context || !this.canvas || !this.canvas2) throw "No canvas"

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

            this.context.drawImage(this.canvas2, 0, 0)

            this.state.pts.push(point)
            this.drawPoints()
        })
    }

    getEventRelativeCoordinates(ev: React.MouseEvent | React.TouchEvent): (Point | Array<Point>)
    {
        if(!this.canvasBoundingRect) throw "No bounding rect for canvas found"

        if(ev.nativeEvent instanceof TouchEvent) {
            ev = ev as React.TouchEvent

            let points = []
            for(let i = 0; i < ev.touches.length; i++) {
                points.push({
                    x:  (ev.touches[i].clientX - this.canvasBoundingRect.left) *
                        (ev.target as HTMLCanvasElement).width /
                        this.canvasBoundingRect.width,
                    y:  (ev.touches[i].clientY - this.canvasBoundingRect.top) *
                        (ev.target as HTMLCanvasElement).height /
                        this.canvasBoundingRect.height,
                } as Point)
            }
            return points
        } else {
            ev = ev as React.MouseEvent

            return {
                x:  (ev.clientX - this.canvasBoundingRect.left) *
                    (ev.target as HTMLCanvasElement).width /
                    this.canvasBoundingRect.width,
                y:  (ev.clientY - this.canvasBoundingRect.top) *
                    (ev.target as HTMLCanvasElement).height /
                    this.canvasBoundingRect.height,
            } as Point
        }
    }

    drawPoints() {
        if(!this.context) return
        this.context.lineCap = 'round'
        this.context.lineWidth = this.state.pen.size
        // this.testDrawPoints(this.context, this.state.pts)
        let pts = this.state.pts
        var i = 0;
        var i2 = pts.length > 1 ? 1 : 0;
        this.context.beginPath();
        this.context.lineJoin = 'round'
        this.context.moveTo(pts[0].x, pts[0].y)
        for (; i < pts.length - i2; i++) {
            this.context.quadraticCurveTo(
                pts[i].x,
                pts[i].y,
                (pts[i].x + pts[i + i2].x) / 2,
                (pts[i].y + pts[i + i2].y) / 2
            );
        }
        this.context.strokeStyle = this.state.pen.color
        this.context.stroke()
        this.context.closePath()
    }

    render() {

        return (
            <div >
                <div className="flex justify-between p-3 border-4 border-gray-500 border-dashed rounded-3xl mb-2">
                    <div className="flex flex-col justify-center">
                        <button
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-light font-mono py-2 px-4 rounded-2xl focus:outline-none"
                            onMouseUpCapture={() => this.clear()}
                        >
                            clear
                        </button>
                    </div>
                    <div className="inline-flex">
                        <div className="flex flex-col justify-center">
                            <div className="text-stroke-cyan-700 p-2 text-transparent opacity-85   overflow-hidden text-4xl text-stroke-md ">
                                Guess:
                            </div>
                        </div>
                        <div className="flex flex-col justify-center">
                            <div className="text-stroke-orange-300 p-2 text-transparent opacity-85   overflow-hidden text-4xl text-stroke-md ">
                                { this.state.guess }
                            </div>
                        </div>
                    </div>
                </div>
                <canvas
                    className=" border-4 border-gray-500 border rounded-3xl shadow-2xl"
                    onMouseMove={(ev) => this.onMouseMove(ev)}
                    onMouseDown={(ev) => this.onMouseDown(ev)}
                    onMouseUp={(ev) => this.onMouseUp(ev)}
                    onMouseLeave={(ev) => this.onMouseUp(ev)}
                    onTouchMove={(ev) => this.onTouchMove(ev)}
                    onTouchStart={(ev) => this.onTouchStart(ev)}
                    onTouchEnd={(ev) => this.onTouchEnd(ev)}
                    ref={this.canvasRef}
                    width="500"
                    height="500"
                    style={{
                        padding: "0",
                        margin: "auto",
                        display: "block",
                        width: "100%",
                        touchAction: "none"
                    }}
                >
                </canvas>
                <img ref={this.imgRef} width="200px"
                    className=" border-4 border-gray-500"
                    // style={{
                    //     width:"200px",
                    //     height:"200px"
                    // }}
                />
            </div>
        )
    }
}

export default Canvas