// ##### Page 1 ##### //

var Component1 = require('../components/component1.jsx');
var Component2 = require('../components/component2.jsx');

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
