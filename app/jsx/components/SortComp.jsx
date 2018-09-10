// ##### Sort By Component ##### //

import React from 'react'
import PropTypes from 'prop-types'

class SortComp extends React.Component {
  static propTypes = {
    formName: PropTypes.string,
    formButton: PropTypes.string,
    relQueryOff: PropTypes.bool,
    query: PropTypes.shape({
      q: PropTypes.string,
      rows: PropTypes.string,
      sort: PropTypes.string,
      start: PropTypes.string,
    }).isRequired,
    count: PropTypes.number.isRequired
  }

  state = {
    rows: this.props.query.rows ? this.props.query.rows : "10",
    sort: this.props.query.sort ? this.props.query.sort : "rel"
  }

  handleChange = (event) => {
    if (event.target.name == "rows") {
      this.setState({rows: event.target.value});
    }
    if (event.target.name == "sort") {
      this.setState({sort: event.target.value});
    }
    $('[name=start]').val('0');
    $('#'+this.props.formButton).click();
  }
  
  render() {
    let rows = Math.ceil(((this.state.rows > this.props.count) ? this.props.count : this.state.rows) / 10) * 10
    return (
      <div className="c-sort">
        <div className="o-input__droplist1">
          <label htmlFor="c-sort1">Sort By:</label>
          <select name="sort" id="c-sort1" form={this.props.formName} value={ this.state.sort } onChange={ this.handleChange }>
          {this.props.relQueryOff ?
            <option value="">Default</option>
          :
            <option value="rel">Relevance</option>
          }
            {/* <option value="pop">Most Popular</option> */}
            <option value="a-title">A-Z By Title</option>
            <option value="z-title">Z-A By Title</option>
            <option value="a-author">A-Z By Author</option>
            <option value="z-author">Z-A By Author</option>
            <option value="asc">Date Ascending</option>
            <option value="desc">Date Descending</option>
          </select>
        </div>
      {(this.props.count > 10) && 
        <div className="o-input__droplist1 c-sort__page-input">
          <label htmlFor="c-sort2">Show:</label>
          <select name="rows" id="c-sort2" form={this.props.formName} value={rows} onChange={ this.handleChange }>
          {/* ToDo: Make this more concise */}
          <option value="10">10</option>
          <option value="20">20</option>
          {(this.props.count > 20) && <option value="30">30</option> }
          {(this.props.count > 30) && <option value="40">40</option> }
          {(this.props.count > 40) && <option value="50">50</option> }
          {(this.props.count > 100) && <option value="100">100</option> }
          </select>
        </div>
      }
      </div>
    )
  }
}

module.exports = SortComp;
