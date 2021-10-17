import React, { useEffect } from "react"
import * as d3 from "d3";

type BarsNode = {
    x0: number
    x1: number
    length: number
}

interface HistogramProps {
    data: number[],
    width: string,
    height: string
}

function Histogram(props: HistogramProps) {

    const numberOfTicks = 10

    const height = parseInt(props.height.replace('px', ''))
    const width = parseInt(props.width.replace('px', ''))


    useEffect(() => {

        const histogramChart = d3.selectAll('.histogramChart')

        d3.selectAll('.histogramChart').selectAll('g').remove()
        const xAxisGroupNode = histogramChart.append('g')
        const yAxisGroupNode = histogramChart.append('g')

        const xAxis = d3.scaleLinear().domain([-1, 1]).range([0, width])
        xAxisGroupNode.attr('transform', `translate(0,${height})`).call(d3.axisBottom(xAxis))

        const yAxis = d3.scaleLinear().range([height, 0])
        yAxisGroupNode.transition().duration(750).call(d3.axisLeft(yAxis))

        const histogram = d3
            .bin()
            .value((d) => d)
            .domain([-1, 1])
            .thresholds(xAxis.ticks(100))

        const bins = histogram(props.data as Array<never>)

        
        const yAxisMaxValues = d3.max(bins, (d) => {
            return d.length
        }) as number
        yAxis.domain([0, yAxisMaxValues])
        console.log(yAxisMaxValues)
        console.log(bins)

            // draw
        yAxisGroupNode.transition().duration(750).call(d3.axisLeft(yAxis))

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
                return xAxis((d as BarsNode).x1) - xAxis((d as BarsNode).x0) - 1
            })
            .attr('height', function heightFunc(d) {
                return height - yAxis(d.length)
            })
            .style('fill', 'blue')
        barsNode.exit().remove()
    })

    return (
        <div className="p-4">
            <svg height={props.height} width={props.width}>
                {/* <text x={width -40} y={height - 36} fontSize={20}>
                    Price
                </text> */}
                <g className="histogramChart " transform={`translate(${50},${-20})`} ></g>
            </svg>
        </div>
    )
}

export default Histogram