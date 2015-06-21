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

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240576.aspx
 */
var PDUType = {
    PDUTYPE_DEMANDACTIVEPDU : 0x11,
    PDUTYPE_CONFIRMACTIVEPDU : 0x13,
    PDUTYPE_DEACTIVATEALLPDU : 0x16,
    PDUTYPE_DATAPDU : 0x17,
    PDUTYPE_SERVER_REDIR_PKT : 0x1A
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var PDUType2 = {
    PDUTYPE2_UPDATE : 0x02,
    PDUTYPE2_CONTROL : 0x14,
    PDUTYPE2_POINTER : 0x1B,
    PDUTYPE2_INPUT : 0x1C,
    PDUTYPE2_SYNCHRONIZE : 0x1F,
    PDUTYPE2_REFRESH_RECT : 0x21,
    PDUTYPE2_PLAY_SOUND : 0x22,
    PDUTYPE2_SUPPRESS_OUTPUT : 0x23,
    PDUTYPE2_SHUTDOWN_REQUEST : 0x24,
    PDUTYPE2_SHUTDOWN_DENIED : 0x25,
    PDUTYPE2_SAVE_SESSION_INFO : 0x26,
    PDUTYPE2_FONTLIST : 0x27,
    PDUTYPE2_FONTMAP : 0x28,
    PDUTYPE2_SET_KEYBOARD_INDICATORS : 0x29,
    PDUTYPE2_BITMAPCACHE_PERSISTENT_LIST : 0x2B,
    PDUTYPE2_BITMAPCACHE_ERROR_PDU : 0x2C,
    PDUTYPE2_SET_KEYBOARD_IME_STATUS : 0x2D,
    PDUTYPE2_OFFSCRCACHE_ERROR_PDU : 0x2E,
    PDUTYPE2_SET_ERROR_INFO_PDU : 0x2F,
    PDUTYPE2_DRAWNINEGRID_ERROR_PDU : 0x30,
    PDUTYPE2_DRAWGDIPLUS_ERROR_PDU : 0x31,
    PDUTYPE2_ARC_STATUS_PDU : 0x32,
    PDUTYPE2_STATUS_INFO_PDU : 0x36,
    PDUTYPE2_MONITOR_LAYOUT_PDU : 0x37
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var StreamId = {
    STREAM_UNDEFINED : 0x00,
    STREAM_LOW : 0x01,
    STREAM_MED : 0x02,
    STREAM_HI : 0x04
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var CompressionOrder = {
    CompressionTypeMask : 0x0F,
    PACKET_COMPRESSED : 0x20,
    PACKET_AT_FRONT : 0x40,
    PACKET_FLUSHED : 0x80
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240577.aspx
 */
var CompressionType = {
    PACKET_COMPR_TYPE_8K : 0x0,
    PACKET_COMPR_TYPE_64K : 0x1,
    PACKET_COMPR_TYPE_RDP6 : 0x2,
    PACKET_COMPR_TYPE_RDP61 : 0x3,
};

/**
 * @see http://msdn.microsoft.com/en-us/library/cc240492.aspx
 */
var Action = {
    CTRLACTION_REQUEST_CONTROL : 0x0001,
    CTRLACTION_GRANTED_CONTROL : 0x0002,
    CTRLACTION_DETACH : 0x0003,
    CTRLACTION_COOPERATE : 0x0004
};