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

var inherits = require('util').inherits;

var TagClass = {
	Universal : 0x00,
	Application : 0x40,
	Context : 0x80,
	Private : 0xC0
};

var TagFormat = {
	Primitive : 0x00,
	Constructed : 0x20
};

function Asn1Tag(tagClass, tagFormat, tagNumber) {
	this.tagClass = tagClass;
	this.tagFormat = tagFormat;
	this.tagNumber = tagNumber;
}

function Asn1Spec(tag) {
	this.tag = tag;
}

Asn1Spec.prototype.implicitTag = function(tag) {
	this.tag = tag;
	return this;
};

Asn1Spec.prototype.explicitTag = function(tag) {
	return new Asn1SpecExplicitTag(tag, this);
};

Asn1Spec.prototype.decode = function(s, decoder) {
	throw 'NODE_RDP_AS1_SPEC_DECODE_NOT_IMPLEMENTED';
};

function Asn1SpecExplicitTag(tag, spec) {
	Asn1Spec.call(this, tag);
	this.spec = spec;
}

inherits(Asn1SpecExplicitTag, Asn1Spec);

Asn1Spec.prototype.decode = function(s, decoder) {
	decoder.decodeExplicitTag(s, this);
};

/**
 * Module exports
 */
module.exports = {
	TagClass : TagClass,
	TagFormat : TagFormat,
	Asn1Tag : Asn1Tag,
	Asn1Spec : Asn1Spec,
	Asn1SpecExplicitTag : Asn1SpecExplicitTag
};
