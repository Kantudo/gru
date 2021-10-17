import React, { useEffect } from "react"
import * as d3 from "d3";

type BarsNode = {
    x0: number
    x1: number
    length: number
}

interface HistogramProps {
    data: number[],
    width: number | undefined,
    height: number | undefined
}

let prevData: number[] = []

function Histogram(props: HistogramProps) {

    // const numberOfTicks = 10

    if (!props.height || !props.width) {
        return <></>
    }

    const [left, top] = [0, -20]
    // const height = parseInt(props.height.replace('px', ''))
    // const width = parseInt(props.width.replace('px', ''))
    const {width, height} = props
    // const height = width/2

    useEffect(() => {

        if (props.data == prevData || props.data.length == 0) {
            return
        }

        prevData = props.data

        const histogramChart = d3.selectAll('.histogramChart')

        d3.selectAll('.histogramChart').selectAll('g').remove()
        const xAxisGroupNode = histogramChart.append('g').attr("class", "xAxis")
        const yAxisGroupNode = histogramChart.append('g').attr("class", "yAxis")

        let maxWeight = (d3.max(props.data, (d) => {
            return Math.abs(d)
        }) as number) * 1.5

        maxWeight = Math.floor(maxWeight*10+1)/10

        const dom: [number, number] = [-maxWeight, maxWeight]

        const xAxis = d3.scaleLinear().domain(dom).range([10, width-10])
        xAxisGroupNode
            .attr('transform', `translate(0,${height})`)
            // .attr('style', 'padding-left: 2px')
            .call(d3.axisBottom(xAxis))

        const yAxis = d3.scaleLinear().range([height, -top])
        // yAxisGroupNode.transition().duration(750).call(d3.axisLeft(yAxis)).attr('transform', `translate(${width/2},0)`)


        const histogram = d3
            .bin()
            .value((d) => d)
            .domain(dom)
            .thresholds(xAxis.ticks(100))

        const bins = histogram(props.data as Array<never>)

        
        const yAxisMaxValues = d3.max(bins, (d) => {
            return d.length
        }) as number
        yAxis.domain([0, yAxisMaxValues*1.1])
        // console.log(yAxisMaxValues)
        // console.log(bins)

            // draw
        yAxisGroupNode.transition().duration(750).call(d3.axisLeft(yAxis).tickFormat((d) => {
            return (d as number)/1000 + 'k'
        }).ticks(0)).attr('visibility', 'hidden')//.attr('transform', `translate(${width/2},0)`)

        const barsNode = histogramChart.selectAll<SVGRectElement, number[]>('rect').data(bins)


        // const { height } = props
        // Deal with the bars and as well as new ones on redraw
        barsNode
            .enter()
            .append('rect')
            .merge(barsNode) // get existing elements
            .transition() // apply changes
            .duration(750)
            .attr('xAxis', 1)
            .attr('transform', function transform(d) {
                return `translate(${xAxis((d as BarsNode).x0)},${yAxis((d as BarsNode).length)})`
            })
            .attr('width', function widthFunc(d) {
                return xAxis((d as BarsNode).x1) - xAxis((d as BarsNode).x0)
            })
            .attr('height', function heightFunc(d) {
                return height - yAxis(d.length)
            })
            .style('fill', '#ffc38e')
            .style('stroke-width', '1')
            .style('stroke', 'rgb(0,0,0)')
        barsNode.exit().remove()

        d3.selectAll("g.yAxis g.tick")
            .append("line")
            .attr("class", "gridline")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0);

        d3.selectAll("g.xAxis g.tick")
            .append("line")
            .attr("class", "gridline")
            .attr("x1", 0)
            .attr("y1", -100)
            .attr("x2", 0)
            .attr("y2", 0);
    })

    return (
        // <div className="p-4">
            <svg height={props.height} width={props.width}>
                {/* <text x={width -40} y={height - 36} fontSize={20}>
                    Price
                </text> */}
                <g className="histogramChart " transform={`translate(${left},${top})`} ></g>
            </svg>
        // </div>
    )
}

export default Histogram