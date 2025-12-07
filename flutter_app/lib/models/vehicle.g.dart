// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'vehicle.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class VehicleAdapter extends TypeAdapter<Vehicle> {
  @override
  final int typeId = 1;

  @override
  Vehicle read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Vehicle(
      id: fields[0] as String,
      type: fields[1] as String,
      model: fields[2] as String,
      batteryLevel: fields[3] as double,
      pricePerMinute: fields[4] as double,
      currentLat: fields[5] as double,
      currentLng: fields[6] as double,
      status: fields[7] as String,
    );
  }

  @override
  void write(BinaryWriter writer, Vehicle obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.model)
      ..writeByte(3)
      ..write(obj.batteryLevel)
      ..writeByte(4)
      ..write(obj.pricePerMinute)
      ..writeByte(5)
      ..write(obj.currentLat)
      ..writeByte(6)
      ..write(obj.currentLng)
      ..writeByte(7)
      ..write(obj.status);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is VehicleAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
