import React from 'react'

interface Option {
    value: string
    label: string
}

interface SelectProps {
    name: string
    options: Option[]
    value: string
    label: string
    onChange: (event: React.SyntheticEvent) => any
}

function Select(props: SelectProps) {
    return (
        <div className="w-full">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                {props.label}
            </label>
            <div className="relative ">
                <select
                    className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    // id="select"
                    // placeholder="Network type"
                    name={props.name}
                    value={props.value}
                    onChange={props.onChange}
                >
                    <option value="" disabled style={{display:"none"}}>Select {props.label}</option>
                    {
                        props.options.map((option, index) => (
                                <option key={index} value={option.value}>{option.label}</option>
                            )
                        )
                    }
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
            </div>
        </div>
    )
}

export default Select