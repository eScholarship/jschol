// ##### Data Table Component ##### //

import React from 'react'

class DataTableComp extends React.Component {
  render() {
    return (
      <div className="c-datatable">
        <table>
          <caption>Fruit Distribution by Country</caption>
          <thead>
            <tr>
              <th scope="col">Country</th>
              <th scope="col">Apples</th>
              <th scope="col"><a href="">Oranges</a></th>
              <th scope="col">Bananas</th>
              <th scope="col">Grapes</th>
              <th scope="col">Strawberries</th>
              <th scope="col">Cherries</th>
              <th scope="col">Blackberries</th>
              <th scope="col">Blueberries</th>
              <th scope="col">Rasberries</th>
              <th scope="col">Cranberries</th>
              <th scope="col">Avocados (a fruit!)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Afghanistan</th>
              <td>245,698</td>
              <td>8,685</td>
              <td>364</td>
              <td>9,752</td>
              <td>6,931</td>
              <td>986,279</td>
              <td>97,4236</td>
              <td>371</td>
              <td>94,378</td>
              <td>846,057</td>
              <td>64,580</td>
            </tr>
            <tr>
              <th scope="row">Bangladesh</th>
              <td>129,475</td>
              <td>5,847</td>
              <td>560,784</td>
              <td>58,694</td>
              <td>8760</td>
              <td>84</td>
              <td>3,604</td>
              <td>976,204</td>
              <td>9,035,304</td>
              <td>86</td>
              <td>9,713</td>
            </tr>
            <tr>
              <th scope="row">Costa Rica</th>
              <td>95,435</td>
              <td>45,856</td>
              <td>420</td>
              <td>7,860</td>
              <td>86</td>
              <td>4,680</td>
              <td>50,486</td>
              <td>3,791</td>
              <td>1,585</td>
              <td>402</td>
              <td>4,864,049</td>
            </tr>
            <tr>
              <th scope="row"><a href="">Denmark</a></th>
              <td>48,420</td>
              <td>58</td>
              <td>94</td>
              <td>94,504</td>
              <td>13,057</td>
              <td>893</td>
              <td>7,092</td>
              <td>106,784</td>
              <td>20,354</td>
              <td>49,520</td>
              <td>503</td>
            </tr>
            <tr>
              <th scope="row">Estonia</th>
              <td>156,210</td>
              <td>6,934</td>
              <td>4,585</td>
              <td>86,046</td>
              <td>587,156</td>
              <td>4,658</td>
              <td>15</td>
              <td>9,675</td>
              <td>5,568,470</td>
              <td>75,057</td>
              <td>755,058</td>
            </tr>
            <tr>
              <th scope="row">Fiji</th>
              <td>765,420</td>
              <td>2,4705</td>
              <td>45</td>
              <td>5,796</td>
              <td>985</td>
              <td>485,610</td>
              <td>7,884</td>
              <td>58</td>
              <td>68,6964</td>
              <td>68</td>
              <td>2,868,469</td>
            </tr>
            <tr>
              <th scope="row">Ghana</th>
              <td>9,586,280</td>
              <td>674,875</td>
              <td>5,200,436</td>
              <td>5,456</td>
              <td>450</td>
              <td>687,905</td>
              <td>56,985</td>
              <td>56</td>
              <td>59,068</td>
              <td>1,068</td>
              <td>9,725</td>
            </tr>
            <tr>
              <th scope="row">Honduras</th>
              <td>64,207</td>
              <td>968</td>
              <td>64,079</td>
              <td>9,321</td>
              <td>47,250</td>
              <td>905</td>
              <td>6,780</td>
              <td>658</td>
              <td>49,856</td>
              <td>4,587</td>
              <td>2,874</td>
            </tr>
            <tr>
              <th scope="row">Indonesia</th>
              <td>87,588</td>
              <td>382</td>
              <td>575</td>
              <td>8,458</td>
              <td>978</td>
              <td>458,087</td>
              <td>50,877</td>
              <td>8845</td>
              <td>4,056,869</td>
              <td>70,674</td>
              <td>755,689</td>
            </tr>
            <tr>
              <th scope="row">Jamaica</th>
              <td>54,778</td>
              <td>480,877</td>
              <td>7,530,788</td>
              <td>7,068</td>
              <td>642</td>
              <td>7,634</td>
              <td>4,989</td>
              <td>8,898</td>
              <td>48,510</td>
              <td>708,651</td>
              <td>6,806</td>
            </tr>
            <tr>
              <th scope="row">Kenya</th>
              <td>57,165</td>
              <td>48</td>
              <td>3,958</td>
              <td>5,420</td>
              <td>1,687,686</td>
              <td>68,420</td>
              <td>56,006</td>
              <td>478</td>
              <td>6,377</td>
              <td>56,924</td>
              <td>97,354</td>
            </tr>
            <tr>
              <th scope="row">Liechtenstein</th>
              <td>78,561</td>
              <td>540,567</td>
              <td>64,054</td>
              <td>5,256</td>
              <td>793,425</td>
              <td>9,806</td>
              <td>507,893</td>
              <td>872,678</td>
              <td>97,510</td>
              <td>698</td>
              <td>670</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

export default DataTableComp;
