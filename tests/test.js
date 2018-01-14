let fs = require('fs'),
  analysis = require('../index.js')

fs.readdirSync(__dirname + '/datasets').forEach(file => {
  if(file.indexOf('.json')>0){

    let data = JSON.parse(fs.readFileSync(__dirname + '/datasets/' + file, 'utf8'))

    //SVIFT TYPE
    console.log(file, 'sviftType', analysis.sviftType(data));

    //TEMPORAL CHECK
    ['x','y'].forEach(axis =>{
      let temporal = analysis.isTemporal(data, axis, true, true)

      if(temporal[0]){
        console.log(file, axis, 'isTemporal', true)

        if(temporal[1]){
          console.log(file, axis, 'isConsistent', true)

          console.log(analysis.temporalIntervals(temporal[2]))

        }else{
          console.log(file, axis, 'isConsistent', false)
        }


      }else{
        console.log(file, axis, 'isTemporal', false)
      }
    })

    console.log(file, 'quartiles', analysis.quartiles(data))

    console.log(file, 'min, max, mean, median, deviation > only for overall', analysis.min(data)[0], analysis.max(data)[0], analysis.mean(data)[0], analysis.median(data)[0], analysis.deviation(data)[0])

    console.log('--------')
  }
})