SBDB API
Version: 1.3 (2021 September)
change log

The SBDB (Small-Body DataBase) API provides a method of requesting machine-readable data for a specified small body within JPL’s SSD/CNEOS Small-Body DataBase (SBDB). The SBDB contains object identification and naming information, orbital data, and selected physical data for all known asteroids and comets within the solar system. A rich set of ancillary data, such as close approach and virtual impactor information, are also available through this API.

Orbits for almost all the small bodies in the SBDB are computed by JPL’s Solar System Dynamics (SSD) group. Those computations use high-precision dynamical and measurement models, based on the most up-to-date set of observational data published by the Minor Planet Center (MPC), including radar astrometry when available, and using sophisticated data weighting schemes and data editing algorithms.

For more information about JPL’s SBDB, see the SBDB Lookup Tool on the SSD website.

HTTP Request
GET https://ssd-api.jpl.nasa.gov/sbdb.api

Example Queries
https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=2015ab
https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Eros
https://ssd-api.jpl.nasa.gov/sbdb.api?spk=2000433&phys-par=1
https://ssd-api.jpl.nasa.gov/sbdb.api?des=73P&alt-des=1&cd-epoch=1
https://ssd-api.jpl.nasa.gov/sbdb.api?des=2009%20FD&neo=1
Query Parameters
One, and only one, of the following query parameters is required: sstr, spk, or des. All other parameters are optional.

Parameter Type Default Description
sstr string object search string: designation in various forms (including MPC packed form) or case-insensitive name; any provisional designation associated with the object may be used; examples: atira, 2003 CP20, 2003cp20, K03C20P, 163693; although the wildcard character \* is allowed, users are encouraged to use the SBDB Query API to find objects matching user-specified constraints
spk int object SPK-ID (e.g., 2000433)
des string object designation (e.g., 2015 AB, 141P, 73P-C, 1995 O1) or IAU number (for numbered asteroids, e.g., 4); unnumbered comet designations do not require a prefix (e.g., 1995 O1 works as well as C/1995 O1)
neo int 0 limit to NEOs only if set to 1 or 2. If set to 2 and the search does not match any NEO but matches one or more non-NEOs, a list of matching primary designations is returned (along with a few additional parameters)
alt-des boolean false include alternate designations (if any) in object section output
alt-spk boolean false include alternate SPK-IDs (if any) in object section output
full-prec boolean false output data in full precision (normally, data are returned in reduced precision for display purposes; covariance data, if requested, are always output in full precision unless cov=mat)
soln-epoch boolean false output the orbit data at the JPL orbit-solution epoch instead of the standard MPC epoch (applies to asteroids only); default orbit only; if the covariance is requested, this parameter is ignored (the covariance is only appropriate at the JPL orbit-solution epoch) [note: some asteroid orbits are only available at the JPL orbit-solution epoch]
cd-epoch boolean false add the calendar date/time formatted version of the orbit epoch
cd-tp boolean false add the calendar date/time formatted version of the time-of-perihelion-passage to the orbital element output (see Orbit Elements Subsection below for details)
cov string output the orbital covariance (if available), in the form specified: mat=full matrix form, vec=upper-triangular vector-stored form, src=upper-triangular vector-stored square-root form (see Orbit Subsection below for details)
nv-fmt string output not_valid_before and not_valid_after date/time values (when defined) in the specified format: jd for Julian day format or cd for calendar date/time (see Orbit Data Section below for details)
anc-data boolean false output availability of ancillary data sets (see Object Data Section below for details)
no-orbit boolean false suppress output of the default orbit
alt-orbits boolean false output alternate (non-default) orbits, if any (typically only for comets)
orbit-defs boolean false output orbit parameter definitions
sat boolean false output satellite data (if any, see Satellite Data Section below for details)
phys-par boolean false output physical parameters (e.g., absolute magnitude: H; see Physical Parameters Section below for details)
ca-data boolean false output close approach data (if any)
ca-body string limit close approach data to those for the specified body (e.g. Earth)
ca-time string cd format to use for close-approach date/time output: cd=calendar date/time format YYYY-MMM-DD hh:mm, jd=Julian date format, both=cd and jd
ca-tunc string num include close approach time uncertainty formatted as requested: num=numeric, fmt= formatted, both=num and fmt (see Close Approach Data Section below for details)
ca-unc boolean false include close approach distance uncertainty ellipse parameters
radar-obs boolean false output radar astrometry data (if any; see Radar Astrometry Data Section below for details)
r-name boolean false include radar station names in radar astrometry data
r-observer boolean false include observer field in radar astrometry data
r-notes boolean false include notes field in radar astrometry data
vi-data boolean false output VI (virtual impactor) data (if any) from JPL’s Sentry system (see VI (Virtual Impactor) Data Section below for details)
discovery boolean false output discovery circumstances and IAU name citation data (if available)
raw-citation boolean false output IAU name citation data (when available) in raw LaTex-like format (normally, special characters are formatted in HTML); requires discovery parameter set true
Data Output
Please always check the JSON payload “signature” object for the API “version”. If the version does not match the version in this document (at the top), there is no guarantee that the format has not changed.

Example "signature" object with "version" value "1.0": "signature":{"version":"1.0","source":"NASA/JPL ... API"}

A valid SBDB API query returns one of the following:

data for the requested object, if the object was unambiguously specified
a list of objects matching the non-unique object specification
a message indicating that no object was found that matched the request
NEOs-Only Mode
To support NEOs-only use cases, a NEO-filter (query parameter neo) is available to limit results to NEOs. This mode supports an additional option which returns limited data on all matching non-NEOs, allowing the client to redirect to a new API call (if required) without setting the neo parameter.

See the next section for an example with neo=2.

Multiple Objects Matching sstr
For normal cases where the query matches a single object, the complete data set from the SBDB is returned in JSON-format. See the next section for details on the data provided.

In cases where more than one object matches, a list is returned with a primary designation pdes and corresponding full-name for each matching object. From pdes, it should be possible to submit a new query with des set to the pdes of interest. Here’s an example result from the query sstr=141P.

{
"signature":{"version":"1.0","source":"NASA/JPL Small-Body Database (SBDB) API"},
"code": 300,
"message": "specified query matched more than one object",
"list": [
{ "pdes": "141P", "name": "141P/Machholz 2" },
{ "pdes": "141P-A", "name": "141P/Machholz 2-A" },
{ "pdes": "141P-D", "name": "141P/Machholz 2-D" }
]
}
A user who wanted only the parent comet 141P could parse this list and submit a new request specifying des=141P which will match only the parent.

Similarly, for neo=2 results matching one or more non-NEO, a list of matching objects is returned. In addition to pdes and name, the perihelion distance q, Earth MOID moid, and orbital class code class are returned. For example, the query sstr=2016%20AA3%2A&neo=2 (where 2016%20AA3%2A is the URL-encoded form of “2016 AA3\*”) might result in the following:

{
"signature":{"version":"1.0","source":"NASA/JPL Small-Body Database (SBDB) API"},
"info" : "specified object matched one or more non-NEO: see list",
"count" : 4,
"list" : [
{
"pdes" : "2016 AA30",
"q" : "2.57",
"name" : "(2016 AA30)",
"moid" : "1.57",
"class" : "MBA"
},
{
"pdes" : "2016 AA33",
"q" : "1.88",
"name" : "(2016 AA33)",
"moid" : "0.887",
"class" : "MBA"
},
{
"pdes" : "2016 AA35",
"q" : "2.91",
"name" : "(2016 AA35)",
"moid" : "1.93",
"class" : "MBA"
},
{
"pdes" : "2016 AA36",
"q" : "2.12",
"name" : "(2016 AA36)",
"moid" : "1.13",
"class" : "MBA"
}
]
}
Normal Data Payload
This output is the result of specifying a unique object.

The following example query https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Eros returns the following payload containing data sections object and orbit.

{
“signature": { "source":"NASA/JPL Small-Body Database (SBDB) API", "version":"1.0" },
"object": {
"shortname":"433 Eros",
"neo":true,
"orbit_class": { "name":"Amor", "code":"AMO" },
"pha":false,
"spkid":"2000433",
"kind":"an",
"orbit_id":"614",
"fullname":"433 Eros (1898 DQ)",
"des":"433",
"prefix":null
},
"orbit": {
"source":"JPL",
"cov_epoch":"2451960.5",
"moid_jup":"3.29",
"t_jup":"4.583",
"condition_code":"0",
"not_valid_before":null,
"model_pars":[],
"rms":"0.36",
"orbit_id":"614",
"producer":"Otto Matic",
"first_obs":"1963-07-15",
"soln_date":"2018-05-29 06:21:04",
"two_body":null,
"epoch":"2458200.5",
"elements": [
{ "value":"0.223", "sigma":"1.2e-08", "name":"e", "title":"eccentricity", "label":"e", "units":null },
{ "value":"1.46", "sigma":"4.8e-10", "name":"a", "title":"semi-major axis", "label":"a", "units":"au" },
{ "value":"1.13", "sigma":"1.8e-08", "name":"q", "title":"perihelion distance", "label":"q", "units":"au" },
{ "value":"10.8", "sigma":"2.8e-06", "name":"i", "title":"inclination", "label":"i", "units":"deg" },
{ "value":"304", "sigma":"1.2e-05", "name":"om", "title":"longitude of the ascending node", "label":"node", "units":"deg" },
{ "value":"179", "sigma":"1.3e-05", "name":"w", "title":"argument of perihelion", "label":"peri", "units":"deg" },
{ "value":"183", "sigma":"5.7e-06", "name":"ma", "title":"mean anomaly", "label":"M", "units":"deg" },
{ "value":"2458516.099", "sigma":"1e-05", "name":"tp", "title":"time of perihelion passage", "label":"tp", "units":"TDB" },
{ "value":"643", "sigma":"3.1e-07", "name":"per", "title":"orbital period", "label":"period", "units":"d" },
{ "value":"0.56", "sigma":"2.7e-10", "name":"n", "title":"mean motion", "label":"n", "units":"deg/d" },
{ "value":"1.78", "sigma":"5.8e-10", "name":"ad", "title":"aphelion distance", "label":"Q", "units":"au" }
],
"equinox":"J2000",
"data_arc":"20041",
"not_valid_after":null,
"n_del_obs_used":"1",
"sb_used":"SB431-N16",
"n_obs_used":"6090",
"comment":null,
"last_obs":"2018-05-28",
"pe_used":"DE431",
"moid":"0.148",
"n_dop_obs_used":"3"
}
}
Sections Output
The following sections are available for output. The “object” section is always output. The “orbit” section is output unless specifically excluded by setting query parameter no-orbit=1. All other sections are output only when explicitly requested via the appropriate query parameter, described in table below.

Section Parameter Description
object Object details, including designation, name, orbit class, etc.
orbit no-orbit Orbit details, including elements, model parameters, covariance (optional), etc.
alt_orbits alt-orbits Orbital elements at alternate epochs, if any (comets only), sorted by epoch
orbit_defs orbit-defs Orbit parameter definitions: title, units, description, etc.
satellites sat Satellite data (if any): designation, orbits, physical parameters, etc.
phys_par phys-par Physical parameters: absolute magnitude (H), rotation period, etc.
ca_data ca-data Close approach data, if any
radar_obs radar-obs Radar astrometry, if any
vi_data vi-data Virtual impactor (VI) data, if any
discovery discovery Discovery data, if any, including name citation when known
Structure of Sections
The following shows the JSON structure of a normal data payload containing all possible sections. The detailed structure of the contents within each section are described in corresponding document sections below. For example, see the Object Subsection for details on the object fields ... data structure.

"object": {
object fields ...
},
"orbit": {
default orbit fields ...
},
"alt_orbits": [
{
first alternate (non-default) orbit fields ...
},
{
second alternate (non-default) orbit fields ...
},
...
],
"orbit-defs": {
{ first orbit parameter definition object },
...
{ last orbit parameter definition object }
},
"sat": [
{ satellite record fields ... },
...
],
"phys_par": [
{ physical parameter fields ... },
...
],
"ca_data": [
{ close approach record fields ... },
...
],
"radar_obs": [
{ radar obs record fields ... },
...
],
"vi_data": [
{ vi record fields },
...
],
"discovery": {
discovery data fields ...
}
Object Data Section
The object data section contains general information about the small body, such as its general category (asteroid or comet, numbered or unnumbered), IAU number, primary and alternate provisional designations, SPK identifier, orbit class, etc.

The following fields are provided in the object section:

Field Name Description
des primary designation (e.g., “4”, “73P-C”, “2009 FD”, “1995 O1”)
spkid primary SPK ID
des_alt list of alternate designations (included only if alt-des=1)
spkid_alt list of alternate SPK IDs (included only if alt-spk=1)
fullname full object name
shortname object name without matching alternate designation (included only if different from fullname)
prefix designation prefix (e.g., “C”, “P”, “D”); null for asteroids
kind object kind code: an=”numbered asteroid”, au=”unnumbered asteroid”, cn=”numbered comet”, cu=”unnumbered comet”
neo NEO flag (true or false)
pha PHA flag (true or false)
orbit_class data object containing orbit class name and code (e.g., “Jupiter-family Comet”, “JFc”)
orbit_id orbit solution identifier (e.g., “102”, “K153/2”)
anc_data ancillary data summary: a set of key/value pairs indicating whether or not a specific data set is available (see below; included only if anc-data=1)
If alternate designations are requested (alt-des=1), the field “des_alt” will contain an array of alternate designations in reverse chronological order, or an emtpy array if no alternates are available. Each element in the array contains one or more key/value pair where the key is one of the following:

key description
pri primary provisional designation
com numbered comet designation for dual-classification asteroids
des alternate new-sytle designation
rn roman-numeral comet designation
yl year-letter old-style comet designation
For example, here is the “des_alt” content for numbered asteroid 5000 IAU:

[
{ "des":"1989 EA11" },
{ "pri":"1987 QN7" },
{ "des":"1979 UK1" }
]
Numbered asteroid 7968 Elst-Pizarro has a dual classification as comet 133P/Elst-Pizarro:

[
{ "pri":"1996 N2" },
{ "des":"1979 OW7" },
{ "com":"133P" }
]
Here is the “des_alt” content for unnumbered asteroid 2002 GU191:

[
{ "des":"2015 FE344" },
{ "des":"2010 JE129" },
{ "des":"2008 CO93" },
{ "des":"2005 VP12" }
]
Numbered comet 1P/Halley has a long list of alternate designations, and its “des_alt” partial (not all designations included) content is as follows:

[
{ "des":"1P/1982 U1","rn":"1986 III","yl":"1982i" },
{ "des":"1P/1909 R1","rn":"1910 II","yl":"1909c" },
...
{ "des":"1P/1682 Q1","rn":"1682" },
...
{ "des":"1P/ 66 B1","rn":"66" },
...
{ "des":"1P/-239 K1","rn":"-239" }
]
Here is an example of “des_alt” content for unnumbered comet C/2001 C1:

[
{ "des":"C/2000 HR81" }
]
If ancillary data sets are requested via query parameter anc_data, a list of available data sets is returned. For each data set, count represents the number of data records available (for NHATS data, count indicates the number of viable trajectories) and ref_url points to a webpage describing the data set. Any or all of the following data sets could be included:

close approach data (ca_data)
radar astrometry data (ra_data)
Sentry virtual impactor (VI) data (vi_data)
NHATS data (nhats_data)
Here is an example of the anc_data object field:

{
"ca_data" : { "count" : 12, "ref_url" : "https://cneos.jpl.nasa.gov/ca/" },
"ra_data" : { "count" : 4, "ref_url" : "https://ssd.jpl.nasa.gov/sb/radar.html" },
"vi_data" : { "count" : 1, "ref_url" : "https://cneos.jpl.nasa.gov/sentry/" },
"nhats_data" : { "count" : 3302718, "ref_url" : "https://cneos.jpl.nasa.gov/nhats/" },
}
Orbit Data Section
It is assumed the user has a basic understanding of osculating orbital elements. Definitions of elements (for example, “perihelion distance”) can be found in the appropriate literature.

The orbit data section contains information about the orbit of the small body, including:

estimated orbit parameters with uncertainties
full covariance information on the primary orbit parameters (optional)
orbit-related quantities (e.g. MOID: minimum orbital intersection distance, orbit condition code, etc.)
information about the set of observations upon which the orbit estimate is based (data arc, number of observations, etc.)
information about the models used for the orbit determination (dynamical model parameters, perturbing body ephemerides, etc.)
orbit solution information (solution identifier, date/time of solution, producer, comment)
Note that almost all of the orbits in the JPL SBDB are computed by the JPL’s Solar System Dynamics (SSD) group and will therefore have a “source” of JPL and a JPL-assigned “orbit_id”, which for asteroids is usually a simple integer.

The contents of the orbit data section are as follows (the entry in the Optional column indicates the request parameter that controls the field):

Field Name Optional Description
orbit_id orbit solution identifier; in most cases, the JPL solution number; for short-period comets, prefixed by a perihelion identifier
epoch epoch of osculation (TDB) in Julian day form
cd_epoch cd-epoch epoch in calendar date format (YYYY-MMM-DD.D); included only if cd-epoch query parameter is set true
equinox equinox of the reference system (e.g., “J2000”)
elements array of data objects for osculating orbital elements (see “elements” subsection below)
model_pars array of data objects for OD model parameters (if any; see “model_pars” subsection below)
covariance cov data object containing orbit covariance in one of three user-selected forms (optional: use cov; see covariance subsection below)
cov_epoch epoch of the covariance (TDB) in Julian day form
moid MOID relative to Earth (au)
moid_jup MOID relative to Jupiter (au)
t_jup Jupiter Tisserand invariant
condition_code orbit condition code (OCC)
rms Normalized RMS of orbit fit
first_obs date of the first (earliest) observation used in the fit (YYYY-MM-DD where DD and/or MM may be ?? when the day and/or month is not known; e.g., 1919-??-??)
last_obs date of the last (latest) observation used in the fit (YYYY-MM-DD where DD and/or MM may be ?? when the day and/or month is not known; e.g., 1919-??-??)
data_arc number of days spanned by the observations used in the fit
n_obs_used total number of observations used (optical and radar)
n_del_obs_used number of radar delay observations used
n_dop_obs_used number of radar Doppler observations used
pe_used name of the JPL planetary ephemeris used
sb_used name of the JPL small-body perturber ephemeris used
two_body flag indicating simple 2-body model was used in the fit
soln_date date/time of the orbit solution (pacific local time)
source source of the orbit solution: JPL, MPC, SAO
producer name of the orbit producer (if any)
not_valid_before nv-fmt date/time, UTC, before which the orbit is not valid; typically null (see below for details on nv-fmt)
not_valid_after nv-fmt date/time, UTC, after which the orbit is not valid; typically null (see below for details on nv-fmt)
comment comments related to this orbit
By default, not_valid_before and not_valid_after fields (when not null) are output in their original format (either Julian date or calendar date/time where the time may be fractional days or time). If nv-fmt=jd, output is formatted as Julian date. If nv-fmt=cd output is formatted as calendar date/time YYYY-MMM-DD hh:mm.

Orbit Subsection: elements
The elements field is an array of data objects, one for each orbital element. These elements parameterize the heliocentric orbit of the small body measured with respect to the Earth-mean-ecliptic frame at the equinox specified in the orbit field equinox (e.g., “J2000”).

The returned orbital elements are “osculating”, which means they apply at a particular time called the “epoch”; this field is output in the orbit data section (see above). The default epoch used for orbital elements returned by the SBDB API is the “standard MPC epoch”. But elements are also available at the JPL “solution epoch”, which is usually different. Elements will be returned at this epoch if the soln-epoch parameter is set in the SBDB API request. Note that the orbital element uncertainties reported in the sigma field refer to the same epoch as the elements. On the other hand, covariance data, requested by setting the cov request parameter, is only available at the solution epoch (see covariance subsection below).

The orbital elements returned by the SBDB API are as follows:

Short-name Label Optional Description
e e eccentricity
q q perihelion distance (au)
tp tp time of perihelion passage (TDB) formatted as Julian day
cd_tp tp cd-tp time of perihelion passage (TDB) formatted as calendar date/time
om node longitude of the ascending node (deg)
w peri argument of perihelion (deg)
i i inclination (deg)
a a semi-major axis (au)
ma M mean anomaly (deg)
per period orbital period (d)
n n mean motion (deg/d)
ad Q aphelion distance (au)
Only the first 6 of these elements are returned if the epoch is not the standard MPC epoch.

The data object for each orbital element has the following fields:

Field Description
name short-name of element
label label for element
title title for element
value value of element
sigma 1-sigma uncertainty in element value
units units (if any)
By default, the API returns data values in reduced precision, generally 3 significant digits (or 3 decimal digits for tp), and sigmas use 2 significant digits. If the full-prec parameter is specified in the API request, all data values are returned in full precision (16 significant digits).

Orbit Subsection: model_pars
The model_pars field is an array of data objects defining the orbit model parameters. These include the non-gravitational parameters for comets, modeling the rocket-like forces due to outgassing (e.g., “A1”, “A2”, etc.). Most asteroids do not use model-pars. A model parameter can be treated in one of 3 ways, as indicated by the kind field:

set to a fixed, exact value,
estimated as part of the orbit solution, or
set to a fixed value with fixed uncertainty, which is “considered” when estimating the other parameters.
The data object for each model parameters has the following fields:

Field Description
n index within the list of estimated and considered parameters, or 0 if simply set
kind “SET”, “EST”, “CON”
name short-name of model parameter (e.g., “A2”)
value value of parameter
title title for parameter
desc definition of parameter
sigma 1-sigma uncertainty in parameter value
units units for parameter (if any)
Orbit Subsection: covariance
This data object provides the covariance matrix (or square root thereof) for the orbital elements and estimated model parameters. This subsection is only included when the cov parameter is set in the API request. In the few rare cases when no covariance is available in the SBDB, this subsection is null. The form used for the covariance matrix is determined by the parameter value, as follows: The covariance matrix will be in one of the following forms selected by the cov query parameter:

cov=mat selects full matrix covariance; units: au, deg, d
cov=vec selects upper-triangular vector-stored covariance; units: au, deg, d
cov=src selects upper-triangular vector-stored square-root covariance; units: au, rad, d
Here, “upper-triangular vector-stored” indicates that only the elements of the upper-triangular portion of the square matrix are returned, and they are listed in column-major order. In other words, if the matrix elements are denoted as (row,column), they are specified in the order (1:1), (1:2), (2:2), (1:3), (2:3), (3:3), and so on. The contents of “covariance” data item are:

Field Description
epoch epoch of the covariance (TDB) in Julian day form
data array of values for the elements of the covariance in the requested form (see below)
labels array of labels for the columns of the covariance matrix, 6 orbital elements followed by the estimated dynamical model parameters, if any
elements elements at the solution epoch corresponding to the covariance data (output only if the main orbit epoch is different from the solution epoch)
The dimension of the covariance matrix is usually 6x6 for asteroids, although it is sometimes 7x7 or more. The matrix is often 8x8 for comets because of the estimated non-gravitational parameters. The dimension can be inferred from the length of the labels array.

If the elements field is output, it will be an array of 6 osculating elements at the solution epoch, as described in the parent data object.

Satellite Data (sat) Section
The satellite data section is included in the output if requested via the sat request parameter. This section is an array of data objects, one for each satellite of the selected small-body (a.k.a. primary body).

The contents of the data object for each satellite record are as follows:

Field Name Description
fullname full designation with name (if any) of the satellite (e.g., (243) Ida I Dactyl)
prov_des provisional designation of the satellite (e.g., S/2008 (41) 1)
year year of discovery
iau_num IAU number assigned to this satellite
iau_name IAU name assigned to this satellite
oid orbit ID of the default satellite orbit
orbit object containing available satellite orbits (see satellite orbit subsection below)
notes notes related to this satellite
ref reference for this satellite
Note that any field above (other than fullname, prov_des and year) may be null indicating its value is not known or not yet defined. When iau_num is null, fullname will be the same as prov_des. In cases where there is no known satellite orbit, the orbit object will be empty ({}).

Satellite Orbit Subsection: orbit
The contents of the data object for each satellite orbit record are as follows. The object key is the orbit ID oid.

Field Name Description
epoch epoch of osculation (TDB) in Julian day form
equinox equinox of the reference system (e.g., J2000)
frame Reference frame (example, EQ for equatorial, EC for ecliptic)
elements array of data objects for satellite orbital elements (see satellite “elements” subsection below)
notes notes related to this satellite orbit
ref reference for this satellite orbit
Satellite Subsection: elements
The elements field is an array of data objects, one for each satellite orbital element. These elements parameterize the bodycentric orbit of the small body measured with respect to the Earth-mean-ecliptic frame EC or the body-equatorial frame EQ at the equinox specified in the field equinox (e.g., “J2000”).

The satellite orbital elements returned by the SBDB API are as follows:

Short-name Label Optional Description
e e eccentricity
q q perihelion distance (m)
tp tp time of perihelion passage (TDB) formatted as Julian day
cd_tp tp cd-tp time of perihelion passage (TDB) formatted as calendar date/time
om node longitude of the ascending node (deg)
w peri argument of perihelion (deg)
i i inclination (deg)
a a semi-major axis (m)
ma M mean anomaly (deg)
per period orbital period (d)
n n mean motion (deg/d)
a_D a/D ratio of semi-major axis to primary diameter
dn_dt dn/dt time rate of change of mean motion (deg/y2)
For many satellite orbits, only a few (perhaps even only one) parameter is known. Elements without known values will have the value field set to null. Similarly, very view orbits will have known uncertainties for their parameters so in almost all cases, the sigma field (see below) will be null. Note also that the units for semi-major axis and perihelion distance are in meters (m) instead of au.

The data object for each satellite orbital element has the following fields:

Field Description
name short-name of element
label label for element
title title for element
value value of element
sigma 1-sigma uncertainty in element value
units units (if any)
Physical Parameters (phys_par) Section
The physical parameters data section contains information about the physical parameters of the small body, such as the absolute magnitude parameters H and G, diameter, rotation period, spectral class, etc. This information is collected from external sources and provided in the SBDB for reference, and for use in the SBDB Query API.

The contents of the physical parameters data section are as follows:

Field Name Description
name name/symbol of physical parameter (e.g. “H”)
value value of the parameter
sigma 1-sigma value of the parameter (if any)
units units of the value (if any)
ref reference (if any)
notes special notes (if any)
title short descriptive name (if any) (e.g., “absolute magnitude”)
desc description of the parameter (e.g., “absolute magnitude (magnitude at 1AU from Sun and observer)”)
Close Approach Data Section
The close approach data section ca_data is included if requested via the ca-data request parameter. This section is an array of data objects, one for each close approach that the small body makes to the Earth, the Moon or any of the other planets. Specifically, these are the close approaches of the small body on its nominal orbit integrated forwards and backwards in time. Various quantities are computed at each close approach, such as the time and close approach distance, and the 1-sigma formal uncertainties in these quantities are also computed and made available.

Close approaches are only included in the list if they are reasonably certain. Specifically, close approaches with 3-sigma time uncertainty greater than 10 days or 3-sigma nominal-distance uncertainty greater than 0.1 au are excluded. Since uncertainties typically grow with time away from epoch, this filter puts an implicit limit on the time period over which the close approaches are listed. The start time of the list goes back as far as the year 1900, but the forward time limit is mostly determined by the uncertainties.

The contents of the data object for each close approach are listed in the following table. Fields listed as Optional in this table are controlled by the listed request parameter. If they are desired, the date/times of the close approaches can be requested, either as Julian dates (jd) or calendar dates (cd), or both, via the ca-time query parameter defined above. The close approach time uncertainties are always output, either in minutes or in a ‘d:hh:mm’ format, or both, according to query parameter ca-tunc (see query parameters above). If the close approach uncertainty ellipse parameters are desired, they are requested via query parameter ca-unc.

Field Name Optional Description
body short-name of the close approach body (e.g., “Earth”, “Juptr”)
jd ca-time Julian date of close approach (TDB: days) (optional)
cd ca-time data and time of close approach (TDB: YYYY-MMM-DD hh:mm) (optional)
sigma_t ca-tunc 3-sigma formal uncertainty in the time of close-approach (minutes)
sigma_tf ca-tunc formatted 3-sigma format uncertainty in the time of close-approach (d_hh:mm where d is days, hh:mm, or < 00:01 meaning less than one minute)
dist nominal close approach distance (au)
dist_min 3-sigma minimum close approach distance (au)
dist_max 3-sigma maximum close approach distance (au)
v_rel velocity relative to the body at close approach (km/s)
v_inf velocity relative to a massless body at close approach (km/s)
unc_major ca-unc semi-major axis of the close approach uncertainty ellipse (km)
unc_minor ca-unc semi-minor axis of the close approach uncertainty ellipse (km)
unc_angle ca-unc angle between the range-LOV and the major axis of the distance uncertainty ellipse (deg)
orbit_ref JPL internal orbit ID used for these results
Close Approach Bodies
The list of close approaches can be restricted to only those for a selected body (e.g. Earth) by specifying that body using the ca-body query parameter; the recognized body names are shortened to 5 characters:

Value Body
Merc Mercury
Venus Venus
Earth Earth
Mars Mars
Juptr Jupiter
Satrn Saturn
Urnus Uranus
Neptn Neptune
Pluto Pluto
Moon Moon
Radar Astrometry Data Section
The radar astrometry data section is included in the output if requested via the radar-obs request parameter. This section is an array of data objects, one for each radar astrometric measurement used in the JPL/SSD orbit solution. These data are provided to the JPL Solar System Dynamics group (https://ssd.jpl.nasa.gov/) by the JPL radar group.

The contents of the data object for each radar measurement are as follows:

Field Name Optional Description
epoch epoch of the radar measurement (YYYY-MM-DD hh:mm:ss UT)
value value of the radar measurement
sigma 1-sigma uncertainty in the measurement
units units of the measurement value and sigma (above): us=microseconds (implies radar delay-type measurement), Hz=Hertz (implies radar Doppler-type measurement)
freq transmitter frequency (MHz)
rcvr receiver station code (e.g., “-1”)
xmit transmitter station code (e.g., “-14”)
rcvr_name r-name receiver station name (e.g., “Arecibo”)
xmit_name r-name transmitter station name (e.g., “DSS-14”, Goldstone)
bp radar bounce-point: C=center-of-mass, P=peak-power
observer r-observer observer name(s), or null
notes r-notes notes related to this observation, or null
VI (Virtual Impactor) Data Section
The Virtual Impactor data section summarizes the potential Earth impacts found by JPL’s Sentry impact monitoring system (https://cneos.jpl.nasa.gov/sentry/) for the selected small body. This section is included in the output only if requested via the vi-data request parameter. The section consists of an array of data objects, one for each potential impact found for the small body.

The contents of the data object for each potential impact are as follows:

Field Name Description
date calendar date of the potential impact (UTC) YYYY-MM-DD.DD
dt delta-time (in Julian years) between the potential impact data and the date of computation
ps hazard rating of potential impact on the Palermo scale
ts hazard rating of potential impact on the Torino scale
ip impact probability of potential impact
width one-sigma semi-width of the LOV uncertainty region, in Earth radii; a value of 0.000 should not be interpreted as exactly zero, but rather as < 1e-4 (defined only for LOV method)
energy kinetic energy of potential impact (in megatons of TNT equivalent), based upon size from computed absolute magnitude and impact velocity, and computed in accordance with the guidelines stated for the Palermo Technical Scale. Uncertainty in this value is dominated by mass uncertainty and the stated value will generally be good to within a factor of three
stretch stretching, related to the semimajor axis of the linear uncertainty region in the target b-plane. It describes how fast one moves across the target plane as sigma_lov changes, and is measured in Earth radii per sigma. The local probability density varies inversely with the stretching, and thus larger stretching values will generally lead to lower impact probabilities (defined only for LOV method)
dist minimum distance on the target plane (scaled b-plane) from the LOV to the geocenter, measured in Earth radii. For these purposes the radius of the Earth, 6420 km, includes some allowance for the thickness of the atmosphere (defined only for LOV method)
sigma_vi Mahalanobis distance between the VI and the nominal orbit. The further from zero, the less likely the event. It is computed in a N-dimensional space based on the number of parameters of the orbital solution, typically 6 (not defined for LOV method)
sigma_lov sigma coordinate along the Line Of Variations (LOV), with respect to the nominal at zero. This is a measure of how well the impacting orbit fits the available observations; the further from zero, the less likely the event. Roughly 99% of all the uncertainty region lies between -3 and +3. Sentry searches for potential impacts out to sigma_lov = +/-5 (defined only for LOV method)
sigma_imp lateral distance in sigmas from the LOV to the Earth’s atmosphere. Zero indicates that the LOV intersects the Earth. It is computed from (Distance - 1)/Width (defined only for LOV method)
v_inf relative velocity (km/s) of potential impact at atmospheric entry neglecting the acceleration caused by the Earth’s gravity field, often called the hyperbolic excess velocity
v_imp velocity (km/s) of potential impact at atmospheric entry
h absolute magnitude, H
diam estimated diameter (km), derived from h using an assumed albedo
mass estimated mass (kg), derived from diam using an assumed density
method method used to find the potential impact: IOBS=impact observation method, LOV=line-of-variation, MC=Monte Carlo
Discovery Data Section
The discovery data section discovery provides information about the discovery circumstances of the small body, if available. This section is included only if requested via the discovery request parameter (see above). This information is only available for numbered asteroids and numbered comets. The official IAU name citation is provided only for asteroids, and it is not available for most asteroids named before discovery data became machine readable.

The contents of the discovery data section are as follows:

Field Name Description
date discovery date YYYY-MMM-DD
location discovery location, if defined (e.g., “Kitt Peak”)
site MPC observatory code, if defined
who name of the person, persons, or group credited with the discovery
ref reference for discovery data (e.g., “20050622/Numbers.arc”)
name official IAU name (if available)
discovery official IAU discovery text (if available)
citation naming citation issued by the IAU (if available)
cref reference for citation data (e.g., “20050721/MPCPages.arc”)
By default, the citation field contains HTML special characters, as needed. But if the raw-citation query parameter is set, the API returns the original LaTex-like markup as published by the MPC in their plain text format distribution of their monthly circulars.

HTTP Response Codes
All errors are returned via appropriate HTTP response codes.

HTTP Code Description Typical Usage
200 OK normal successful result for a single object: object data returned (an error message is returned if the object was not found)
300 Multiple Choices the specified parameters matched more than one object: matching list provided
400 Bad Request the request contained invalid keywords and/or content: details returned
405 Method Not Allowed the request used an incorrect method (see the HTTP Request section)
500 Internal Server Error the database is not available at the time of the request
503 Service Unavailable the server is currently unable to handle the request due to a temporary overloading or maintenance of the server, which will likely be alleviated after some delay
Change Log
Version 1.3 (2021 September)
Additional output fields available in VI Data Section
Version 1.2 (2020 January)
Added query parameter sat (see Query Parameters section and Satellite Section for details)
Version 1.1 (2018 August)
Added query parameter cd-tp (see Query Parameters section for details)
Version 1.0 (2018 July)
Initial release
