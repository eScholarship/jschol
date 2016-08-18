// ##### Page 2 ##### //

var Component1 = require('../components/component1.jsx');
var Component3 = require('../components/component3.jsx');

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
