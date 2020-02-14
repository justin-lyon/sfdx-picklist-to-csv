const fs = require('fs')
const path = require('path')

const reader = require('./xml-reader')
const writer = require('./csv-writer')

const ExportToCsv = require('export-to-csv').ExportToCsv

const csvOptions = {
  fieldSeparator: ',',
  showLabels: true,
  showTitle: false,
  title: 'Picklist Dependencies',
  useTextFile: false,
  useBom: true,
  useKeysAsHeaders: true
}

const fieldsFolder = path.join(__dirname, 'fields')
const sources = fs.readdirSync(fieldsFolder)

/**
 * fields: [{
 *   name: <Field_Api_Name__c>,
 *   path: path/to/Field_Api_Name__c.field-meta.xml,
 *   xml: <field xml content>
 * }]
 */
const fields = sources
  .filter(s => s.endsWith('.field-meta.xml'))
  .map(s => {
    const fieldPath = path.join(__dirname, 'fields', s)
    return {
      name: s.replace('.field-meta.xml', ''),
      path: fieldPath,
      xml: fs.readFileSync(fieldPath).toString()
    }
})

console.log('fields', fields.map(f => f.name))

Promise.all(fields.map(reader))
  .then(normalized => {
    const csvRows = []
    normalized.forEach(field => {
      csvRows.push(...writer(field))
    })

    const csvExporter = new ExportToCsv(csvOptions)
    const csvData = csvExporter.generateCsv(csvRows, true)

    fs.writeFileSync(path.join(__dirname, 'output', 'data.json'), JSON.stringify(normalized, null, 2))
    fs.writeFileSync(path.join(__dirname, 'output', 'csvData.json'), JSON.stringify(csvData, null, 2))
    fs.writeFileSync(path.join(__dirname, 'output', 'result.csv'), csvData)
  })
  .catch(err => {
    console.error('Error', err)
  })
