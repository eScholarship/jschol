// ##### Search Component ##### //

import React from 'react'
import Form from 'react-router-form'

class SearchComp1 extends React.Component {
  render() {
    return (
      <Form to='/search' method="GET" className="c-search1">
        <label className="c-search1__label" htmlFor="c-search1__field">search</label>
        <input type="search" id="c-search1__field" name="q" className="c-search1__field" placeholder="Search for articles, books, theses, and more" defaultValue={this.props.query} />
        <button type="submit" className="c-search1__submit-button" aria-label="submit search"></button>
        <button className="c-search1__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}

module.exports = SearchComp1;
