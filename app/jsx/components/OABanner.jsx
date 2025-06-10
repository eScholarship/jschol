// appears on item pages
// is only rendered if the publication is in these series: *_postprints, lbnl_rw or rgpo_rw
import React from "react"

const OABanner = ({ unit }) => {
  if (unit && /.*_postprints$|^(lbnl|rgpo)_rw$/.test(unit.id)) {
    return (
      <p className="o-well-colored">
        Many UC-authored scholarly publications are freely available on this site
        because of the UC&apos;s <a href="https://osc.universityofcalifornia.edu/open-access-at-uc/open-access-policy/">
          open access policies</a>. <a href="https://help.escholarship.org/support/tickets/new">Let us know how this access is important for you.</a>
      </p>
    )
  }
  return null
}

export default OABanner
