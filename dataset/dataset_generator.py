#!/usr/bin/env python3
"""
IntelliInspect Dataset Generator
Generates realistic manufacturing quality control datasets for demo purposes.
"""

import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

def get_user_input():
    """Get dataset parameters from user"""
    print("🏭 IntelliInspect Dataset Generator")
    print("=" * 50)
    
    while True:
        try:
            rows = int(input("How many rows do you want to generate? (minimum 10): "))
            if rows < 10:
                print("❌ Please enter at least 10 rows for meaningful data.")
                continue
            break
        except ValueError:
            print("❌ Please enter a valid number.")
    
    while True:
        days = input(f"Time span in days? (default: {max(1, rows//25)}): ").strip()
        if not days:
            days = max(1, rows//25)  # Default: ~25 rows per day
            break
        try:
            days = int(days)
            if days < 1:
                print("❌ Please enter at least 1 day.")
                continue
            break
        except ValueError:
            print("❌ Please enter a valid number.")
    
    while True:
        pass_rate = input("Target pass rate % (default: 80): ").strip()
        if not pass_rate:
            pass_rate = 80
            break
        try:
            pass_rate = float(pass_rate)
            if pass_rate < 0 or pass_rate > 100:
                print("❌ Pass rate must be between 0-100%.")
                continue
            break
        except ValueError:
            print("❌ Please enter a valid percentage.")
    
    filename = input("Output filename (default: manufacturing_data.csv): ").strip()
    if not filename:
        filename = "manufacturing_data.csv"
    elif not filename.endswith('.csv'):
        filename += '.csv'
    
    return rows, days, pass_rate, filename

def generate_realistic_data(num_rows, time_span_days, target_pass_rate):
    """Generate realistic manufacturing sensor data"""
    data = []
    
    # Set random seed for some consistency but allow variation
    np.random.seed(42)
    random.seed(42)
    
    # Calculate time parameters
    end_date = datetime.now()
    start_date = end_date - timedelta(days=time_span_days)
    
    # Calculate failure rate from pass rate
    target_fail_rate = (100 - target_pass_rate) / 100
    
    print(f"\n🔧 Generating {num_rows} rows over {time_span_days} days...")
    print(f"📊 Target pass rate: {target_pass_rate}%")
    
    for i in range(num_rows):
        # Show progress for large datasets
        if i % max(1, num_rows//10) == 0:
            progress = (i / num_rows) * 100
            print(f"   Progress: {progress:.0f}%")
        
        # Generate timestamp
        timestamp = start_date + timedelta(
            days=random.uniform(0, time_span_days),
            hours=random.uniform(0, 24),
            minutes=random.uniform(0, 60)
        )
        
        # Determine if this should be a failure based on target rate
        should_fail = random.random() < target_fail_rate
        
        if not should_fail:  # Generate PASS conditions
            # Normal/optimal operating conditions
            temperature = np.random.normal(72, 2.5)    # Optimal: 69-75°C
            pressure = np.random.normal(1.25, 0.15)    # Optimal: 1.1-1.4
            vibration = np.random.normal(0.12, 0.03)   # Low vibration: 0.09-0.15
            speed = np.random.normal(1450, 40)         # Optimal: 1410-1490 RPM
            
            # Small chance of failure even in good conditions (realistic)
            quality = 'fail' if random.random() < 0.02 else 'pass'
            
        else:  # Generate FAIL conditions
            # Choose failure mode randomly
            failure_mode = random.choice(['overheat', 'pressure', 'vibration', 'speed', 'multiple'])
            
            if failure_mode == 'overheat':
                temperature = np.random.normal(85, 3)      # High temp
                pressure = np.random.normal(1.3, 0.2)      # Normal pressure
                vibration = np.random.normal(0.2, 0.05)    # Slight vibration
                speed = np.random.normal(1480, 50)         # Slightly high speed
                
            elif failure_mode == 'pressure':
                temperature = np.random.normal(74, 2)      # Normal temp
                pressure = np.random.normal(2.2, 0.3)      # High pressure
                vibration = np.random.normal(0.15, 0.04)   # Normal vibration
                speed = np.random.normal(1520, 60)         # Higher speed
                
            elif failure_mode == 'vibration':
                temperature = np.random.normal(73, 2)      # Normal temp
                pressure = np.random.normal(1.4, 0.2)      # Normal pressure  
                vibration = np.random.normal(0.55, 0.15)   # High vibration
                speed = np.random.normal(1460, 50)         # Normal speed
                
            elif failure_mode == 'speed':
                temperature = np.random.normal(75, 2)      # Slightly high temp
                pressure = np.random.normal(1.35, 0.2)     # Normal pressure
                vibration = np.random.normal(0.18, 0.05)   # Normal vibration
                speed = np.random.normal(1680, 80)         # Very high speed
                
            else:  # multiple failures
                temperature = np.random.normal(88, 4)      # High temp
                pressure = np.random.normal(2.4, 0.4)      # High pressure
                vibration = np.random.normal(0.65, 0.2)    # High vibration
                speed = np.random.normal(1650, 100)        # High speed
            
            # Mostly fails, but occasional pass (equipment sometimes survives stress)
            quality = 'fail' if random.random() < 0.9 else 'pass'
        
        # Ensure realistic bounds
        temperature = max(60, min(95, temperature))
        pressure = max(0.5, min(3.5, pressure))
        vibration = max(0.05, min(1.0, vibration))
        speed = max(1200, min(1800, speed))
        
        # Add some special cases every 50 rows for variety
        if i % 50 == 0 and i > 0:
            if random.random() < 0.3:  # 30% chance of extreme case
                if random.random() < 0.5:
                    # Perfect conditions
                    temperature = random.uniform(70, 73)
                    pressure = random.uniform(1.15, 1.35)
                    vibration = random.uniform(0.08, 0.12)
                    speed = random.uniform(1430, 1470)
                    quality = 'pass'
                else:
                    # Equipment failure
                    temperature = random.uniform(90, 95)
                    pressure = random.uniform(2.8, 3.5)
                    vibration = random.uniform(0.8, 1.0)
                    speed = random.uniform(1700, 1800)
                    quality = 'fail'
        
        data.append({
            'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'temperature': round(temperature, 1),
            'pressure': round(pressure, 2),
            'vibration': round(vibration, 2),
            'speed': int(speed),
            'quality': quality
        })
    
    return data

def save_dataset(data, filename):
    """Save dataset to CSV and show statistics"""
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Sort by timestamp
    df = df.sort_values('timestamp').reset_index(drop=True)
    
    # Calculate statistics
    total_rows = len(df)
    pass_count = len(df[df['quality'] == 'pass'])
    fail_count = len(df[df['quality'] == 'fail'])
    actual_pass_rate = (pass_count / total_rows) * 100
    
    # Get date range
    start_date = df['timestamp'].min()
    end_date = df['timestamp'].max()
    
    # Save to CSV
    df.to_csv(filename, index=False)
    
    # Display results
    print(f"\n✅ Dataset Generation Complete!")
    print("=" * 50)
    print(f"📄 File: {filename}")
    print(f"📊 Total Rows: {total_rows:,}")
    print(f"✅ Pass Count: {pass_count:,} ({actual_pass_rate:.1f}%)")
    print(f"❌ Fail Count: {fail_count:,} ({100-actual_pass_rate:.1f}%)")
    print(f"📅 Date Range: {start_date} to {end_date}")
    
    print(f"\n🔧 Sensor Value Ranges:")
    print(f"🌡️  Temperature: {df['temperature'].min():.1f}°C - {df['temperature'].max():.1f}°C")
    print(f"⚡ Pressure: {df['pressure'].min():.2f} - {df['pressure'].max():.2f}")
    print(f"📳 Vibration: {df['vibration'].min():.2f} - {df['vibration'].max():.2f}")
    print(f"⚙️  Speed: {df['speed'].min():,} - {df['speed'].max():,} RPM")
    
    print(f"\n📈 Quality Distribution:")
    quality_dist = df['quality'].value_counts()
    for quality, count in quality_dist.items():
        percentage = (count / total_rows) * 100
        print(f"   {quality.upper()}: {count:,} rows ({percentage:.1f}%)")
    
    # Show sample data
    print(f"\n📋 Sample Data (First 5 Rows):")
    print(df.head().to_string(index=False))
    
    return df

def main():
    """Main function"""
    try:
        # Get user input
        rows, days, pass_rate, filename = get_user_input()
        
        # Check if file exists
        if os.path.exists(filename):
            overwrite = input(f"⚠️  File '{filename}' exists. Overwrite? (y/N): ").lower()
            if overwrite != 'y':
                print("❌ Operation cancelled.")
                return
        
        # Generate dataset
        data = generate_realistic_data(rows, days, pass_rate)
        
        # Save and display results
        df = save_dataset(data, filename)
        
        print(f"\n🚀 Ready to use with IntelliInspect!")
        print(f"   Upload '{filename}' to the web app and start your demo!")
        
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()
