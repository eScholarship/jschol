// ##### Page 3 ##### //

import React from 'react'

import Component2 from '../components/component2.jsx'
import Component3 from '../components/component3.jsx'

class Pears extends React.Component {
  render() {
		return (
	   	<div>
	   		<h2>Pears</h2>
	   		<Component3 />
	   		<Component2 />
	     	<p>[pear content]</p>
	    </div>
  	)
	}
}

module.exports = Pears;
