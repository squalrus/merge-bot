module.exports = `### merge bot test mode

#### overview

<table>
<tr><td>status</td><td>❌</td></tr>
<tr><td>triggered by</td><td>foo</td></tr>
</table>

#### integration requirements

<table>
<tr><td>required label(s)</td><td>[\"ready\",\"merge\"]</td></tr>
<tr><td>blocking label(s)</td><td>[\"do not merge\"]</td></tr>
<tr><td>reviewers required</td><td>true</td></tr>
<tr><td>merge method</td><td>squash</td></tr>
</table>

#### pull request details

<table>
<tr><td>labels</td><td>[\"foo\",\"bar\",\"ready\"]</td></tr>
<tr><td>requested reviewers</td><td>[\"squalrus\",\"timgrove\"]</td></tr>
<tr><td>reviewers</td><td>[]</td></tr>
<tr><td>checks</td><td>{}</td></tr>
</table>`;
