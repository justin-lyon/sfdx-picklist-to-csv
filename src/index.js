const fs = require('fs')
const path = require('path')
const XmlReader = require('xml-reader')
const ExportToCsv = require('export-to-csv').ExportToCsv

const sources = [
  'MyField__c.field-meta.xml'
]

const readValues = ({ name, xml }) => {
  return new Promise((resolve, reject) => {
    const field = { name, values: [] }

    const reader = XmlReader.create({ stream: true, parentNodes: false })
    reader.on('tag:controllingField', ({ children }) => {
      field.controllingField = children[0].value
    })

    reader.on('tag:valueSettings', ({ children }) => {
      const item = {
        value: children.filter(c => c.name === 'valueName')[0].children[0].value,
        controlling: children.filter(c => c.name === 'controllingFieldValue').map(c => c.children[0].value)
      }
      field.values.push(item)
    })

    reader.on('done', () => {
      resolve(field)
    })

    reader.parse(xml)
  })
}

const fields = sources.map(s => ({
  name: s.replace('.field-meta.xml', ''),
  path: path.join(__dirname, 'fields', s)
}))

console.log(fields)

const fieldsWithXml = fields.map(f => ({
  ...f,
  xml: fs.readFileSync(f.path).toString()
}))

const csvOptions = {
  fieldSeparator: ',',
  showLabels: true,
  showTitle: false,
  title: 'Picklist Dependencies',
  useTextFile: false,
  useBom: true,
  useKeysAsHeaders: true
}

Promise.all(fieldsWithXml.map(readValues))
.then(data => {
  const csvRows = []
  data.forEach(field => {
      field.values.forEach(item => {
        item.controlling.forEach(control => {
          const row = {
            field: field.name,
            controllingField: field.controllingField,
            controlling: control,
            value: item.value
          }
          csvRows.push(row)
        })
      })
    })

    const csvExporter = new ExportToCsv(csvOptions)
    const csvData = csvExporter.generateCsv(csvRows, true)

    fs.writeFileSync(path.join(__dirname, 'output', 'data.json'), JSON.stringify(data, null, 2))
    fs.writeFileSync(path.join(__dirname, 'output', 'csvData.json'), JSON.stringify(csvData, null, 2))
    fs.writeFileSync(path.join(__dirname, 'output', 'result.csv'), csvData)
  })
