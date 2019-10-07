namespace SW03 {

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(BME680_I2C_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE, false);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt8BE);
    }

    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int8LE);
    }

    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.UInt16LE);
    }

    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(BME680_I2C_ADDR, NumberFormat.Int16LE);
    }

    function readBlock(reg: number, count: number): number[] {
        let buf: Buffer = pins.createBuffer(count);
        pins.i2cWriteNumber(BME680_I2C_ADDR, reg, NumberFormat.UInt8BE, false);
        buf = pins.i2cReadBuffer(BME680_I2C_ADDR, count);

        let tempbuf: number[] = [];
        for (let i: number = 0; i < count; i++) {
            tempbuf[i] = buf[i];
        }
        return tempbuf;
    }

    export function begin(): void {
        
    }
    export function readAltitude(): number {
        toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Wait for PDR bit, indicates we have new pressure data
        let counter = 0;
        while( (getreg(STATUS) & (1<<1)) == 0)
        {
            if(++counter > 600) return(-999); //Error out after max of 512ms for a read
            sleep(1);
        }

        let res: number[] = readBlock(OUT_P_MSB, 3)
    
        // The least significant bytes l_altitude and l_temp are 4-bit,
        // fractional values, so you must cast the calulation in (float),
        // shift the value over 4 spots to the right and divide by 16 (since 
        // there are 16 values in 4-bits). 
        let tempcsb: number  = (res[2]>>4)/16.0;
    
        let altitude: number = ((res[0] << 8) | res[1]) + tempcsb;
    
        return(altitude);
    }
    export function readAltitudeFt(): number {
        return(readAltitude() * 3.28084);
    }
    export function readPressure(): number {
        
        //Check PDR bit, if it's not set then toggle OST
        if(getreg(STATUS) & (1<<2) == 0) toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        //Wait for PDR bit, indicates we have new pressure data
        let counter = 0;
        while(getreg(STATUS) & (1<<2) == 0)
        {
            if(++counter > 600) return(-999); //Error out after max of 512ms for a read
            sleep(1);
        }
        let res: number[] = readBlock(OUT_P_MSB, 3)
        
        toggleOneShot(); //Toggle the OST bit causing the sensor to immediately take another reading

        // Pressure comes back as a left shifted 20 bit number
        let pressure_whole: number  = res[0]<<16 | res[1]<<8 | res[2];
        pressure_whole >>= 6; //Pressure is an 18 bit number with 2 bits of decimal. Get rid of decimal portion.

        res[2] &= B00110000; //Bits 5/4 represent the fractional component
        res[2] >>= 4; //Get it right aligned
        let pressure_decimal: number = res[2]/4.0; //Turn it into fraction

        let pressure: number = pressure_whole + pressure_decimal;

        return(pressure);
    }
    export function readTemp(): number {
        
    }
    export function readTempF(): number {
        
    }
    export function setModeBarometer(): void {
        
    }
    export function setModeAltimeter(): void {
        
    }
    export function setModeStandby(): void {
        
    }
    export function setModeActive(): void {
        
    }
    export function setOversampleRate(byte): void {
        
    }
    export function enableEventFlags(): void {
        
    }
    function toggleOneShot(): void {
        
    }
}