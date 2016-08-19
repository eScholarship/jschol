// ##### Page 1 ##### //

import React from 'react'

import Component1 from '../components/component1.jsx'
import Component2 from '../components/component2.jsx'

class Apples extends React.Component {
  render() {
		return (
	   	<div>
	   		<h2>Apples</h2>
	   		<Component1 />
	   		<Component2 />
	     	<p>[apple content]</p>
	    </div>
 		)
	}
}

module.exports = Apples;
