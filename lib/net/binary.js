function BinaryStream(str) {
	this.offset = 0;
	this.buffer = Buffer(str || '');
}
