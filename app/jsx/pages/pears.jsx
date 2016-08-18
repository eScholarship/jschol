// ##### Page 3 ##### //

var Component2 = require('../components/component2.jsx');
var Component3 = require('../components/component3.jsx');

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
