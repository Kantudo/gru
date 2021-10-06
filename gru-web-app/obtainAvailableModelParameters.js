let netWorkTypes = [
    {
        value: "cnn",
        label: "Convolucional",
        parameters: {
            ncl: {
                label: "Num of conv layers",
                value: null
            },
            filters: {
                label: "Num of filters",
                value: null
            },
            pool: {
                label: "Max pooling pool size",
                value: null
            },
            nhl: {
                label: "Num of hidden layers",
                value: null
            },
            nphl: {
                label: "Neurons per hidden layer",
                value: null
            }
        },
    },
    {
        value: "mlp",
        label: "MLP",
        parameters: {
            hl: {
                label: "Num of hidden layers",
                value: null
            },
            nphl: {
                label: "Neurons per hidden layer",
                value: null
            }
        }
    }
]

let fs = require('fs');

netWorkTypes.forEach(net => {
    let files = fs.readdirSync('./models/'+net.value);
    files = files.map(file => {let a = file.split("_"); a.shift(); return a})
    files.forEach(file => {
        file.forEach(param => {
            let key = param.replace(/[1-9]/g, "")
            let value = param.replace(/[a-zA-Z]/g, "")
            if (net.parameters[key].value == null) {
                net.parameters[key].value = value
            } else {
                if (net.parameters[key].value !== value) {
                    if (net.parameters[key].value instanceof Object) {
                        !net.parameters[key].value.includes(value) && net.parameters[key].value.push(value)
                        net.parameters[key].value.sort((a, b) => parseInt(a)-parseInt(b))
                    } else {
                        net.parameters[key].value = [net.parameters[key].value, value]
                        net.parameters[key].value.sort((a, b) => parseInt(a)-parseInt(b))
                    }
                }
            }
        })
    })

    // console.log(net)
})
let data = JSON.stringify(netWorkTypes);
fs.writeFileSync('networks.json', data);
