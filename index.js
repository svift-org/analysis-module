/*
 *
 * This module is a library of statistical helpers for analysing 'generic' datasets
 *
 */

'use strict';

let moment = require('moment'),
  d3 = require('d3'),
  dateFormats = require(__dirname + '/config/dateformats.json')

let analysis = (function () {
 
  let module = {}

  /*----- SVIFT TYPE CHECKING -----*/

  /**
  * Check what kind of data structure the svift-data-object holds
  *
  * @param {Object} `data` SVIFT-Data-Object to be analysed
  * @returns {string} the type, currently supports (single,row,column,multi) the latter is multiple rows and multiple columns
  */

  module.sviftType = data => {
    if(data.labels.length <= 1 && data.data.length <= 1 && data.data[0].data.length <= 1){
      return 'single'
    }

    if(data.data.length <= 1){
      return 'row'
    }

    if(data.data[0].data.length <= 1 && data.labels.length <= 1){
      return 'column'
    }

    return 'multi'
  }

  /*----- TEMPORAL FUNCTIONALITIES -----*/

  /**
  * Function checks if the labels might be of temporal kind
  *
  * @param {Object} `data` SVIFT-Data-Object to be analysed
  * @param {string} `type` (x|y) which axis should be checked
  * @param {boolean} `consistency` (true|false) check for consistency
  * @param {boolean} `returnMoment` (true|false) return, moment.js objects
  * @returns {array} depending on consistency and returnMoment [{boolean} isTemporal, {boolean} isConsistent, {Array} Moment Objects]
  */

  module.isTemporal = (data,type,consistency,returnMoment) => {
    let labels = (type === 'y')?module.extractYLabels(data):data.labels

    if(labels == undefined || !labels || labels.length == 0) return false

    let isTemporal = true,
      consistent = []

    //Check if every label matches a dateformat, record the matched format
    labels.forEach((l,li)=>{
      let thisConsistent = []
      let thisTemporal = false
      dateFormats.forEach((date,di)=>{
        if(moment(l, date, true).isValid()){
          thisTemporal = true
          thisConsistent.push(di)
        }
      })
      if(!thisTemporal){
        isTemporal = false
      }
      consistent.push(thisConsistent)
    })

    //check if all labels share at least one common dateformat (recorded above)
    if(isTemporal && consistency){
      isTemporal = [isTemporal, false]
      if(returnMoment){
        isTemporal.push([])
      }
      consistent[0].forEach(c=>{
        let found = true
        consistent.forEach((cc,ci)=>{
          if(ci!=0){
            if(cc.indexOf(c)==-1){
              found = false
            }
          }
        })
        if(found){
          isTemporal[1] = true
          if(returnMoment && isTemporal[2].length === 0){
            labels.forEach(l=>{
              isTemporal[2].push(moment(l, dateFormats[c], true))
            })
          }
        }
      })
    }

    return isTemporal;
  }

  /**
  * Check if the temporal labels have an regular interval
  *
  * @param {array} `data` Array of moment.js objects
  * @returns {array} with detected intervals, (array.length == 0) means no interval found
  */
  module.temporalIntervals = (data) => {
    let intervals = [],
      types = ['years','months','days','minutes','seconds']

    data.forEach((d,di)=>{
      if(di > 0){
        let interval = []
        types.forEach(t=>{
          interval.push(d.diff(data[di-1], t, true))
        })
        intervals.push(interval)
      }
    })

    let rIntervals = []

    types.forEach((t,ti)=>{
      let same = true
      intervals.forEach(inter=>{
        if(inter[ti] != intervals[0][ti]){
          same = false
        }
      })
      if(same){
        rIntervals.push({
          key:t,
          value:intervals[0][ti]
        })
      }
    })

    return rIntervals
  }

  /*----- DATA SORTING -----*/



  /*----- STATISTICAL FUNCTIONALITIES -----*/

  module.deviation = data => {
    return module.onEach(data, d3.deviation)
  }

  module.mean = data => {
    return module.onEach(data, d3.mean)
  }

  module.median = data => {
    return module.onEach(data, d3.median)
  }

  module.min = data => {
    return module.onEach(data, d3.min)
  }

  module.max = data => {
    return module.onEach(data, d3.max)
  }

  module.sum = data => {
    return module.onEach(data, d3.sum)
  }

  module.quantile = data => {
    return module.onEach(data, d3.quantile)
  }

  module.variance = data => {
    return module.onEach(data, d3.variance)
  }

  module.quartiles = data => {
    return [
      module.onEach(data, d3.quantile, .25),
      module.onEach(data, d3.quantile, .5),
      module.onEach(data, d3.quantile, .75)
    ]
  }

  model.outliers = data => {
    let quartiles = module.quartiles(data),
      outliers = []

    //For everything
    let igr = (quartiles[2][0]-quartiles[0][0])*1.5
  }

  /**
  * Apply a certain function (mostly d3) to a data object
  *
  * @param {Object} `data` SVIFT-Data-Object to be analysed
  * @param {function} `func` analysis function to process an array
  * @returns {array} with three values from the func [overall, per row, per column]
  */
  module.onEach = (data, func, params) => {
    let values = []

    //across all columns and rows
    let multi = []
    data.data.forEach(d=>{
      d.data.forEach(dd=>{
        multi.push(dd)
      })
    })
    values.push((params)?func(multi,params):func(multi))

    //per row basis
    let rows = []
    data.data.forEach(d=>{
      if(params){
        rows.push(func(d.data, params))
      }else{
        rows.push(func(d.data))
      }
    })
    values.push(rows)

    //per column basis
    let columns = []
    for(let i = 0; i<data.data[0].data.length; i++){
      let col = []
      data.data.forEach(d=>{
        col.push(d.data[i])
      })
      columns.push((params)?func(col,params):func(col))
    }
    values.push(columns)

    return values    
  }

  /*----- HELPER -----*/

  /**
  * Extract the labels of the y-axis as an array
  *
  * @param {Object} `data` SVIFT-Data-Object to be analysed
  * @returns {array} with labels in their original data type (likely string or number)
  */
  module.extractYLabels = data => {
    let labels = []
    data.data.forEach(d=>{
      labels.push(d.label)
    })
    return labels
  }

  return module;
 
})();

module.exports = analysis;