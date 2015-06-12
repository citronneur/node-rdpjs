/*
 * Copyright (c) 2014-2015 Sylvain Peyrefitte
 *
 * This file is part of node-rdp.
 *
 * node-rdp is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var asn1 = require('../asn1');

function AlgorithmIdentifier() {
	return new asn1.univ.Sequence({
		algorithm : new asn1.univ.ObjectIdentifier(),
		parameters : new asn1.univ.Null()
	});
}

function TbsCertificate() {
	return new asn1.univ.Sequence({
		version : new asn1.univ.Integer().explicitTag(new asn1.spec.Asn1Tag(asn1.spec.TagClass.Context, asn1.spec.TagFormat.Constructed, 0)),
		serialNumber : new asn1.univ.Integer(),
		signature : AlgorithmIdentifier()
	});
}

function X509Certificate() {
	return new asn1.univ.Sequence({
		tbsCertificate : TbsCertificate()
		//...
	});
}

/**
 * Module Export
 */
module.exports = {
	X509Certificate : X509Certificate
};