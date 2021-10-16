import './index.css'
import React from 'react'
import Select from '../utils/Select'
// import Histogram from './Histogram'
import {inferr, Net} from "../classify"


import canvas2Num from './utils'
import networks from '../networks.json'

interface Point {
    x: number,
    y: number
}


class Canvas extends React.Component {
    canvasRef: React.RefObject<HTMLCanvasElement>
    imgRef: React.RefObject<HTMLImageElement>
    canvas: HTMLCanvasElement | null
    canvasBoundingRect: DOMRect | null
    context: CanvasRenderingContext2D | null
    state: {
        pen: {
            color: string,
            size: number
        },
        pts: Array<Point>,
        touchPts: Array<Array<Point>>,
        isDown: boolean,
        guess: string,
        selectedNet: Net | null,
        availableNets: Net[],
        model: any
    }
    canvas2: HTMLCanvasElement | undefined
    context2: CanvasRenderingContext2D | null | undefined

    constructor(props: any) {
        super(props)

        this.state = {
            pen: {
                color: "#ff7f90",//"#34c3eb",
                size: 25
            },
            pts: [],
            touchPts: [],
            isDown: false,
            guess: '',
            selectedNet: null,
            availableNets: [
                {
                    type: "mlp",
                    quantized: true,
                    noisy: true,
                    parameters: {
                        hl: 3,
                        nphl: 128
                    }
                },
                {
                    type: "cnn",
                    quantized: true,
                    noisy: true,
                    parameters: {
                        ncl: 3,
                        filters: 32,
                        pool: 2,
                        nhl: 1,
                        nphl: 128
                    }
                }
            ],
            model: null
        }

        this.state.selectedNet = this.state.availableNets[0]
        inferr(this.state.selectedNet).then((model: any) => {this.state.model = model})

        this.canvasRef = React.createRef<HTMLCanvasElement>()
        this.imgRef = React.createRef<HTMLImageElement>()
        this.canvas = null
        this.context = null

        this.canvasBoundingRect = null

        this.drawPoints = this.drawPoints.bind(this)
        this.drawPointsTouch = this.drawPointsTouch.bind(this)
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
        this.handleNetChange = this.handleNetChange.bind(this)
    }

    getContext() {
        if (!this.canvasRef.current) return
        this.canvas = this.canvasRef.current
        this.canvas2 = document.createElement('canvas')
        this.context2 = this.canvas2?.getContext('2d') ?? null
        this.context = this.canvas?.getContext('2d') ?? null
        if (this.canvas) {
            this.canvasBoundingRect = this.canvas.getBoundingClientRect()

            this.canvas2.width = this.canvas.width
            this.canvas2.height = this.canvas.height
        }
    }

    componentDidMount() {
        this.getContext()
        window.addEventListener('resize', this.handleResize)
    }
    componentDidUpdate() {
        if (this.canvas2 && this.context2 && this.canvas) {
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
        if (this.canvas) {

            canvas2Num(this.canvas, 28, 28, this.state.model).then(({ img, boundingBoxes, prediction }) => {

                this.imgRef.current && (this.imgRef.current.src = img)


                if (!this.context) return null

                this.setState({ guess: prediction.toString() })

                // let {upperLeft, lowerRight} = boundingBox

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
            this.state.touchPts.push([point])
        })
        this.drawPointsTouch()
    }

    onMouseUp(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        ev.preventDefault()
        this.state.isDown = false

        this.context2 && this.canvas && this.context2.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context2 && this.canvas && this.context2.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height)
        this.setState({ pts: [] })

        this.updateImg()
    }

    onTouchEnd(ev: React.TouchEvent<HTMLCanvasElement>) {
        // ev.preventDefault()
        this.state.isDown = false

        this.context2 && this.canvas && this.context2.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.context2 && this.canvas && this.context2.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height)
        this.setState({ touchPts: [] })

        this.updateImg()
    }

    onMouseMove(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        ev.preventDefault()

        if (!this.state.isDown || !this.context || !this.canvas) return
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
        // console.log(coords.length);

        (coords).forEach((point, i) => {
            if (i > 1) return
            if (!this.state.isDown || !this.context || !this.canvas || !this.canvas2) throw "No canvas"

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

            this.context.drawImage(this.canvas2, 0, 0)

            this.state.touchPts[this.state.touchPts.length - 1 - i].push(point)

            this.drawPointsTouch()
        })
    }

    getEventRelativeCoordinates(ev: React.MouseEvent | React.TouchEvent): (Point | Array<Point>) {
        if (!this.canvas) throw "No bounding rect for canvas found"
        this.canvasBoundingRect = this.canvas.getBoundingClientRect()

        if (window.TouchEvent && ev.nativeEvent instanceof TouchEvent) {
            ev = ev as React.TouchEvent

            let points = []
            for (let i = 0; i < ev.touches.length; i++) {
                points.push({
                    x: (ev.touches[i].clientX - this.canvasBoundingRect.left) *
                        (ev.target as HTMLCanvasElement).width /
                        this.canvasBoundingRect.width,
                    y: (ev.touches[i].clientY - this.canvasBoundingRect.top) *
                        (ev.target as HTMLCanvasElement).height /
                        this.canvasBoundingRect.height,
                } as Point)
            }
            return points
        } else {
            ev = ev as React.MouseEvent

            return {
                x: (ev.clientX - this.canvasBoundingRect.left) *
                    (ev.target as HTMLCanvasElement).width /
                    this.canvasBoundingRect.width,
                y: (ev.clientY - this.canvasBoundingRect.top) *
                    (ev.target as HTMLCanvasElement).height /
                    this.canvasBoundingRect.height,
            } as Point
        }
    }

    drawPointsTouch() {
        // this.testDrawPoints(this.context, this.state.pts)
        this.state.touchPts.forEach(pts => {
            if (!this.context) return
            this.context.lineCap = 'round'
            this.context.lineWidth = this.state.pen.size
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
        })
    }

    drawPoints() {
        if (!this.context) return
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

    async handleNetChange(event: React.SyntheticEvent) {
        const target = event.target as HTMLInputElement
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        let newNet: Net
        if (name == "type") {
            let availableNet = this.state.availableNets.find((net: Net) => net.type == target.value)
            if(availableNet) {
                newNet = availableNet
                this.setState({
                    selectedNet: newNet
                })
                inferr(newNet).then(model => {this.setState({model: model})})
            }
        } else {
            // console.log(value)
            if (name == "quantized" || name == "noisy") {
                newNet = {
                    ...this.state.selectedNet,
                    [name]: value
                } as Net
            }   else {
                newNet = {
                    ...this.state.selectedNet,
                    parameters: {
                        ...this.state.selectedNet?.parameters,
                        [name]: value
                    }
                } as Net
            }

            let i = this.state.availableNets.findIndex((net: Net) => (net.type == newNet.type))
            this.state.availableNets[i] = newNet
            this.setState({
                selectedNet: newNet,
            })
            inferr(newNet).then(model => {this.setState({model: model})})
        }

        // console.log(this.state.selectedNet)

        // this.setState({

        //     [name]: value
        // });
    }

    render() {

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <div
                        className="flex justify-between p-3 border-4 border-gray-500 border-dashed rounded-3xl mb-2 mx-auto"
                    >
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
                                <div className="text-stroke-cyan-700 p-2 text-transparent opacity-85   overflow-hidden text-4xl text-stroke-sm md:text-stroke-md ">
                                    Guess:
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="text-stroke-orange-300 p-2 text-transparent opacity-85   overflow-hidden text-4xl text-stroke-sm md:text-stroke-md">
                                    {this.state.guess}
                                </div>
                            </div>
                        </div>
                    </div>
                    <canvas
                        className=" border-4 border-gray-500 border-dashed rounded-3xl shadow-2xl"
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
                            touchAction: "none",
                            maxWidth: "500px",
                            maxHeight: "500px"
                        }}
                    >
                    </canvas>
                </div>

                <div
                    className="grid grid-cols-1 gap-8 justify-items-center border-4 border-gray-500 border-dashed rounded-3xl py-4"
                    style={{ maxWidth: "500px" }}
                >
                    <div className="flex flex-col justify-center align-middle">
                        <img ref={this.imgRef}
                            className=" border-4 border-gray-500"
                            style={{
                                width: "220px",
                                height: "220px",
                                // maxWidth:"220px",
                                // maxHeight:"220px"
                            }}
                        />
                    </div>
                    
                    {/* <div>
                        <Histogram></Histogram>
                    </div> */}

                    <div className="flex flex-col justify-evenly flex-wrap w-10/12">
                        <div className="flex justify-around w-full">
                            <div className="md:flex md:items-center">
                                <label className=" block text-gray-500 font-bold truncate">
                                    <input
                                        type="checkbox"
                                        name="quantized"
                                        className="mr-2 leading-tight"
                                        checked={this.state.selectedNet?.quantized ?? false}
                                        onChange={this.handleNetChange}
                                    />
                                    <span className="text-sm">Quantization (4 levels)</span>
                                </label>
                            </div>
                            <div className="md:flex md:items-center">
                                <label className={" block text-gray-500 font-bold " + (!this.state.selectedNet?.quantized ? 'opacity-25' : '')} >
                                    <input
                                        type="checkbox"
                                        name="noisy"
                                        className="mr-2 leading-tight"
                                        disabled={!this.state.selectedNet?.quantized}
                                        checked={this.state.selectedNet?.noisy ?? false}
                                        onChange={this.handleNetChange}
                                    />
                                    <span className="text-sm">Noise</span>
                                </label>
                            </div>
                        </div>

                        <div className="w-full mt-4">
                            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                                Net type
                            </label>
                            <div className="relative ">
                                <select
                                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                    id="net-type"
                                    placeholder="Network type"
                                    name="type"
                                    value={this.state.selectedNet?.type ?? ""}
                                    onChange={this.handleNetChange}
                                >
                                    <option value="" disabled style={{display:"none"}}>Select network type</option>
                                    {
                                        (networks as any[]).map(net => (
                                            <option value={net.value} key={net.value}>{net.label}</option>
                                        ))
                                    }
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>


                        {
                            this.state.selectedNet?.type &&
                            (networks as any[]).map((net: any) => net.value).includes(this.state.selectedNet?.type) &&
                            (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {
                                        Object.entries(
                                            (networks as any).find((net: any) => net.value == this.state.selectedNet?.type).parameters
                                        ).map(([key, entry]) => (
                                            <Select
                                                value={((this.state.selectedNet?.parameters as any)[key]).toString()}
                                                options={
                                                    typeof (entry as any).value == "object"
                                                    ?
                                                    ((entry as any).value.map((v: number) => ({ value: v, label: v })))
                                                    :
                                                    ([{ value: (entry as any).value, label: (entry as any).value }])
                                                }
                                                label={(entry as any).label}
                                                onChange={this.handleNetChange}
                                                name={key}
                                                key={key}
                                            ></Select>
                                        ))
                                    }
                                </div>
                            )
                        }

                        {/* <div>
                            <div className="relative inline-block w-full text-gray-700">
                                <select
                                    className="w-full h-10 pl-3 pr-6 text-base border rounded-lg appearance-none focus:shadow-outline"
                                    placeholder="Network type"
                                    value={this.state.selectedNet?.type ?? "MLP"}
                                    onChange={this.handleNetChange}
                                >

                                    <option value="CON">Convolutional</option>
                                    <option value="MLP">MLP</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none h-10">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div> */}


                    </div>
                </div>
            </div>
        )
    }
}

export default Canvas