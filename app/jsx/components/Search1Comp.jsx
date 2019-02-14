// ##### Search 1 Component - used on global (non-unit) pages and on search page itself ##### //

import React from 'react'
//import Form from 'react-router-form'
import PropTypes from 'prop-types'
import Form from '../components/FormComp.jsx'

export default class SearchComp1 extends React.Component {

  render() {
    let query = this.props.query
    let q = query && query.q ? query.q : ''

    // Preserve filters for any subsequent search box query
    let filters = [] 
    if (query) {
      Object.keys(query).forEach(k=>{ 
        let v = query[k]
        if (["q", "start", "info_start"].includes(k)) { //q is unnecessary; Reset start and info_start)
        } else if (typeof v === 'string') {
          filters.push(<input type="hidden" key={k} name={k} value={v} />) 
        } else {
          v.forEach(f=>{
            filters.push(<input type="hidden" key={k+f} name={k} value={f} />) 
          })
        }
      })
    }

    return (
      <Form to="/search" className="c-search1">
        <label className="c-search1__label" htmlFor="c-search1__field">search</label>
        <input type="search" id="c-search1__field" name="q" className="c-search1__field" placeholder="Search over 200,000 items" defaultValue={q} autoCapitalize="off" />
        {filters}
        <button type="submit" className="c-search1__submit-button" aria-label="submit search"></button>
        <button type="button" className="c-search1__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}
