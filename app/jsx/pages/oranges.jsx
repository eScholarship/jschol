// ##### Page 2 ##### //

import React from 'react'

import Component1 from '../components/component1.jsx'
import Component3 from '../components/component3.jsx'

class Oranges extends React.Component {
  render() {
		return (
			<div>
				<h2>Oranges</h2>
	   		<Component1 />
	   		<Component3 />
	     	<p>[orange content]</p>
	    </div>
  	)
	}
}

module.exports = Oranges;
