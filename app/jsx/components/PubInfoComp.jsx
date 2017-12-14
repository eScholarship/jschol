// ##### Publication Information Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'

class PubInfoComp extends React.Component {
  render() {
    return (
      <div className="c-pubinfo">
        {/* all elements below are optional */}
        <h2 className="c-pubinfo__location-heading">Published Web Location</h2>
        <a className="c-pubinfo__link" href="https://www.google.com/url?Loremipsumdolorsitamet,consecteturadipisicingelitIllumofficiiscumqueipsa,quisquamnequedignissimosprovidentnesciunt,cumquibusdamofficiaanimilaborumNecessitatibusperspiciatisbeatae,consequunturquidemvoluptatemteneturex">https://www.google.com/url?Loremipsumdolorsitamet,consecteturadipisicingelitIllumofficiiscumqueipsa,quisquamnequedignissimosprovidentnesciunt,cumquibusdamofficiaanimilaborumNecessitatibusperspiciatisbeatae,consequunturquidemvoluptatemteneturex</a>
        <div className="c-pubinfo__statement">
          The data associated with this publication are available at:
        </div>
        <a className="c-pubinfo__link" href="https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&cad=rja&uact=8&ved=0ahUKEwjNoJGCza_UAhVL3mMKHc3RBbAQFgguMAE&url=https%3A%2F%2Fwww.nlsinfo.org%2Fcontent%2Fcohorts%2Fnlsy79&usg=AFQjCNEXMJlw2tkgdnkJQKLowLir73PLFQ&sig2=tzuso11Shf3OE0sAk6kpUw">https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&cad=rja&uact=8&ved=0ahUKEwjNoJGCza_UAhVL3mMKHc3RBbAQFgguMAE&url=https%3A%2F%2Fwww.nlsinfo.org%2Fcontent%2Fcohorts%2Fnlsy79&usg=AFQjCNEXMJlw2tkgdnkJQKLowLir73PLFQ&sig2=tzuso11Shf3OE0sAk6kpUw</a>
        <a href="" className="c-pubinfo__license">
          <LazyImageComp
            src="images/cc-by-nc-large.svg"
            alt="creative commons attribution-noncommercial 4.0 international public license" />
        </a>
      </div>
    )
  }
}

module.exports = PubInfoComp;
