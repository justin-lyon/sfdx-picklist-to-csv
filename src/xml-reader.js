const XmlReader = require('xml-reader')

const reader = ({ name, xml }) => {
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
    .on('done', () => {
      resolve(field)
    })
    .on('error', error => {
      reject(error)
    })

    reader.parse(xml)
  })
}

module.exports = reader