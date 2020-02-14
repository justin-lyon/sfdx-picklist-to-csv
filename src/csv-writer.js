const writer = field => {
  const csvField = []
  field.values.forEach(item => {
    item.controlling.forEach(control => {
      const row = {
        field: field.name,
        controllingField: field.controllingField,
        controllingValue: control,
        value: item.value
      }
      csvField.push(row)
    })
  })
  return csvField
}

module.exports = writer