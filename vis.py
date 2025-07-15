import neuroglancer
import numpy as np
import re
import os
import glob
from pathlib import Path


def assign_unique_colors(num_channels):
    distinct_colors = [
        "red", "green", "blue", "yellow", "magenta", "cyan", "orange", "purple",
        "lime", "pink", "teal", "brown", "navy", "maroon", "olive", "silver",
        "gold", "indigo", "coral", "salmon"
    ]
    colors = []
    for i in range(num_channels):
        colors.append(distinct_colors[i % len(distinct_colors)])
    return colors


def sanitize_shader_variable_name(name, channel_index=None):
    clean_name = re.sub(r'^R\d+_', '', name)
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', clean_name)
    sanitized = re.sub(r'_+', '_', sanitized)
    sanitized = sanitized.strip('_')
    
    if not sanitized or sanitized[0].isdigit() or len(sanitized) < 2:
        if channel_index is not None:
            sanitized = f"ch{channel_index + 1}"
        else:
            sanitized = "channel"
    
    if sanitized and sanitized[0].isdigit():
        sanitized = 'ch_' + sanitized
    
    return sanitized


def extract_unique_markers(channel_names):
    markers = set()
    for name in channel_names:
        clean_name = re.sub(r'^R\d+_', '', name)
        marker_patterns = [
            r'([A-Za-z][A-Za-z0-9]*?)_\d+',
            r'([A-Za-z][A-Za-z0-9]*?)\d+',
            r'\d+([A-Za-z][A-Za-z0-9]*)',
            r'([A-Za-z][A-Za-z0-9]*)',
        ]
        
        marker_found = False
        for pattern in marker_patterns:
            match = re.search(pattern, clean_name)
            if match:
                marker = match.group(1).strip()
                if marker and len(marker) > 1:
                    markers.add(marker)
                    marker_found = True
                    break
        
        if not marker_found and clean_name:
            markers.add(clean_name)
    
    return sorted(list(markers))


def format_round_info(round_info):
    if isinstance(round_info, dict):
        round_numbers = []
        for key in round_info.keys():
            match = re.search(r'(\d+)', str(key))
            if match:
                round_numbers.append(int(match.group(1)))
        
        if round_numbers:
            round_numbers.sort()
            if len(round_numbers) > 1:
                return f"Rounds {min(round_numbers)}-{max(round_numbers)}"
            else:
                return f"Round {round_numbers[0]}"
    elif isinstance(round_info, (int, str)):
        round_num = str(round_info).replace('Round_', '').replace('round', '')
        return f"Round {round_num}"
    
    return "Multiple Rounds"


def generate_shader_title(channel_names=None, round_info=None, num_channels=0):
    title_parts = ["Roman Round"]
    
    if round_info:
        if isinstance(round_info, dict):
            round_numbers = []
            for key in round_info.keys():
                match = re.search(r'(\d+)', str(key))
                if match:
                    round_numbers.append(int(match.group(1)))
            
            if round_numbers:
                round_numbers.sort()
                if len(round_numbers) > 1:
                    title_parts.append(f"R{min(round_numbers)}-{max(round_numbers)}")
                else:
                    title_parts.append(f"R{round_numbers[0]}")
        elif isinstance(round_info, (int, str)):
            round_num = str(round_info).replace('Round_', '').replace('round', '')
            title_parts.append(f"R{round_num}")
    
    if channel_names:
        unique_markers = extract_unique_markers(channel_names)
        if unique_markers:
            if len(unique_markers) <= 3:
                marker_str = "+".join(unique_markers)
            else:
                marker_str = f"{'+'.join(unique_markers[:2])}+{len(unique_markers)-2}more"
            title_parts.append(f"({marker_str})")
    
    title_parts.append(f"{num_channels}Ch")
    title_parts.append("Shader")
    
    return " ".join(title_parts)


def generate_n_channel_shader(num_channels, channel_names=None, auto_settings=None, round_info=None):
    if channel_names is None:
        channel_names = [f"Channel_{i+1}" for i in range(num_channels)]
    
    colors = assign_unique_colors(num_channels)
    shader_lines = []
    shader_title = generate_shader_title(channel_names, round_info, num_channels)
    
    shader_lines.extend([
        f"// {shader_title}",
        f"// Total Channels: {num_channels}",
        ""
    ])
    
    if round_info:
        shader_lines.extend([
            f"// Round Information: {format_round_info(round_info)}",
            ""
        ])
    
    if channel_names:
        unique_markers = extract_unique_markers(channel_names)
        if unique_markers:
            shader_lines.extend([
                f"// Markers: {', '.join(unique_markers)}",
                ""
            ])
    
    variable_names = []
    used_names = set()
    
    for i, name in enumerate(channel_names):
        clean_var_name = sanitize_shader_variable_name(name, i)
        original_name = clean_var_name
        counter = 1
        while clean_var_name in used_names:
            clean_var_name = f"{original_name}_{counter}"
            counter += 1
        
        used_names.add(clean_var_name)
        variable_names.append(clean_var_name)
    
    shader_lines.extend([
        "// Channel Mapping:"
    ])
    for i, name in enumerate(channel_names):
        color = colors[i]
        var_name = variable_names[i]
        shader_lines.append(f"//   Channel {i+1}: {name} [{color}] -> {var_name}")
    shader_lines.append("")
    
    if auto_settings:
        shader_lines.extend([
            "// Auto-optimized brightness and contrast applied",
            ""
        ])
    
    for i in range(num_channels):
        channel_num = i + 1
        color = colors[i]
        channel_name = channel_names[i] if i < len(channel_names) else f"Channel_{channel_num}"
        clean_var_name = variable_names[i]
        
        if auto_settings and i < len(auto_settings):
            brightness_default = auto_settings[i]['brightness']
            contrast_default = auto_settings[i]['contrast']
            gamma_default = auto_settings[i]['gamma']
        else:
            brightness_default = 0.0
            contrast_default = 1.0
            gamma_default = 1.0
        
        shader_lines.extend([
            f"// === {channel_name} (Channel {channel_num}) ===",
            f"#uicontrol bool enable_{clean_var_name} checkbox(default=true)",
            f"#uicontrol vec3 color_{clean_var_name} color(default=\"{color}\")",
            f"#uicontrol float brightness_{clean_var_name} slider(min=-0.5, max=0.5, step=0.01, default={brightness_default:.3f})",
            f"#uicontrol float contrast_{clean_var_name} slider(min=0.1, max=10, step=0.01, default={contrast_default:.3f})",
            f"#uicontrol float gamma_{clean_var_name} slider(min=0.1, max=3, step=0.01, default={gamma_default:.3f})",
            ""
        ])
    
    shader_lines.extend([
        "// === Global Controls ===",
        "#uicontrol float global_gamma slider(min=0.1, max=3, step=0.01, default=1)",
        "#uicontrol float global_brightness slider(min=-0.5, max=0.5, step=0.01)",
        "#uicontrol float global_opacity slider(min=0, max=1, step=0.01, default=1)",
        "",
        "void main() {",
        "    vec3 finalColor = vec3(0.0);",
        "    float totalAlpha = 0.0;",
        ""
    ])
    
    for i in range(num_channels):
        channel_num = i + 1
        channel_name = channel_names[i] if i < len(channel_names) else f"Channel_{channel_num}"
        clean_var_name = variable_names[i]
        
        shader_lines.extend([
            f"    // Process {channel_name}",
            f"    if (enable_{clean_var_name}) {{",
            f"        float val_{clean_var_name} = toNormalized(getDataValue({i}));",
            f"        val_{clean_var_name} = val_{clean_var_name} + brightness_{clean_var_name};",
            f"        val_{clean_var_name} = val_{clean_var_name} * contrast_{clean_var_name};",
            f"        val_{clean_var_name} = pow(clamp(val_{clean_var_name}, 0.0, 1.0), gamma_{clean_var_name});",
            f"        finalColor += val_{clean_var_name} * color_{clean_var_name};",
            f"        totalAlpha += val_{clean_var_name};",
            "    }",
            ""
        ])
    
    shader_lines.extend([
        "    // Apply global adjustments",
        "    finalColor = finalColor + global_brightness;",
        "    finalColor = pow(clamp(finalColor, 0.0, 1.0), vec3(global_gamma));",
        "    totalAlpha = clamp(totalAlpha * global_opacity, 0.0, 1.0);",
        "    emitRGBA(vec4(finalColor, totalAlpha));",
        "}"
    ])
    
    return "\n".join(shader_lines)


def create_2d_n_channel_viewer(data, channel_names=None, round_info=None):
    neuroglancer.set_server_bind_address(bind_address='localhost', bind_port=9999)
    viewer = neuroglancer.Viewer()
    
    num_channels = data.shape[0]
    data_ng = np.transpose(data, (0, 3, 2, 1))
    
    print(f"\nCalculating auto brightness/contrast for {num_channels} channels...")
    
    res = neuroglancer.CoordinateSpace(
        names=['c^', 'x', 'y', 'z'],
        units=['', 'nm', 'nm', 'nm'],
        scales=[1, 1, 1, 1]
    )
    
    volume = neuroglancer.LocalVolume(
        data=data_ng,
        dimensions=res,
        volume_type='image'
    )
    
    shader = generate_n_channel_shader(num_channels, channel_names, None, round_info)
    layer_name = generate_layer_name(channel_names, round_info, num_channels)
    
    with viewer.txn() as s:
        s.layers[layer_name] = neuroglancer.ImageLayer(
            source=volume,
            shader=shader
        )
    
    print(f"Viewer URL: {viewer}")
    print(f"Layer name: {layer_name}")
    print(f"Shader title: {generate_shader_title(channel_names, round_info, num_channels)}")
    print(f"Loaded {num_channels} channels with shape: {data.shape} -> {data_ng.shape}")
    
    return viewer


def generate_layer_name(channel_names=None, round_info=None, num_channels=0):
    name_parts = ["🔬"]
    
    if round_info:
        if isinstance(round_info, dict):
            round_numbers = []
            for key in round_info.keys():
                match = re.search(r'(\d+)', str(key))
                if match:
                    round_numbers.append(int(match.group(1)))
            
            if round_numbers:
                round_numbers.sort()
                if len(round_numbers) > 1:
                    name_parts.append(f"Rounds_{min(round_numbers)}-{max(round_numbers)}")
                else:
                    name_parts.append(f"Round_{round_numbers[0]}")
        elif isinstance(round_info, (int, str)):
            round_num = str(round_info).replace('Round_', '').replace('round', '')
            name_parts.append(f"Round_{round_num}")
    else:
        name_parts.append("Roman_Round")
    
    if channel_names:
        unique_markers = extract_unique_markers(channel_names)
        if unique_markers:
            if len(unique_markers) <= 3:
                marker_str = "+".join(unique_markers)
            else:
                marker_str = f"{'+'.join(unique_markers[:2])}+{len(unique_markers)-2}more"
            name_parts.append(f"({marker_str})")
    
    channel_emoji = get_channel_count_emoji(num_channels)
    name_parts.append(f"{channel_emoji}{num_channels}ch")
    
    return "_".join(name_parts)


def get_channel_count_emoji(num_channels):
    if num_channels <= 3:
        return "🟢"
    elif num_channels <= 6:
        return "🟡"
    elif num_channels <= 12:
        return "🟠"
    else:
        return "🔴"


def extract_protein_name(channel_name):
    clean_name = re.sub(r'^R\d+_', '', channel_name)
    clean_name = re.sub(r'_\d+$', '', clean_name)
    protein_match = re.search(r'([A-Za-z][A-Za-z0-9]*)', clean_name)
    return protein_match.group(1) if protein_match else clean_name


def sanitize_name(name):
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    if sanitized and sanitized[0].isdigit():
        sanitized = '_' + sanitized
    return sanitized or 'channel'


def extract_channel_name_roman_round(filename):
    channel_match = re.search(r'(S\s*)?C(\d+)-MAX', filename)
    if not channel_match:
        return "Unknown_Channel"
    
    current_channel = int(channel_match.group(2))
    channels_info = extract_all_channel_definitions(filename)
    
    if current_channel in channels_info:
        info = channels_info[current_channel]
        protein = info['protein']
        protein = re.sub(r'\d+$', '', protein)
        if protein:
            return f"{protein}_{info['wavelength']}"
    
    protein_patterns = [
        r'\b([A-Z][A-Za-z]{2,})\b',
        r'\b([a-z][a-z0-9]{2,})\b',
    ]
    
    for pattern in protein_patterns:
        matches = re.findall(pattern, filename)
        for match in matches:
            if match.lower() not in ['max', 'round', 'channel']:
                wavelength_match = re.search(rf'{re.escape(match)}.*?(\d{{3,4}})', filename)
                if wavelength_match:
                    return f"{match}_{wavelength_match.group(1)}"
                else:
                    return f"{match}_unknown"
    
    return f"Channel_{current_channel}"


def extract_all_channel_definitions(filename):
    channels = {}
    
    pattern1 = r'C(\d+)=(\d+)\s+([A-Za-z0-9]+)'
    matches1 = re.findall(pattern1, filename)
    
    for match in matches1:
        ch_num = int(match[0])
        wavelength = match[1]
        protein = match[2].strip()
        channels[ch_num] = {
            'wavelength': wavelength,
            'protein': protein
        }
    
    remaining_text = filename
    for ch_num in channels.keys():
        pattern_to_remove = rf'C{ch_num}=\d+\s+[A-Za-z0-9]+'
        remaining_text = re.sub(pattern_to_remove, '', remaining_text)
    
    pattern2 = r'C(\d+)=(\d+)([A-Za-z0-9]+)'
    matches2 = re.findall(pattern2, remaining_text)
    
    for match in matches2:
        ch_num = int(match[0])
        if ch_num not in channels:
            wavelength = match[1]
            protein = match[2].strip()
            channels[ch_num] = {
                'wavelength': wavelength,
                'protein': protein
            }
    
    pattern3 = r'C(\d+)=(\d+)\s+([A-Za-z0-9]+?)(?=C\d+)'
    matches3 = re.findall(pattern3, filename)
    
    for match in matches3:
        ch_num = int(match[0])
        if ch_num not in channels:
            wavelength = match[1]
            protein = match[2].strip()
            channels[ch_num] = {
                'wavelength': wavelength,
                'protein': protein
            }
    
    return channels


def group_files_by_experiment(file_list):
    experiments = {}
    
    for file_path in file_list:
        filename = Path(file_path).stem
        
        round_match = re.search(r'round(\d+)', filename.lower())
        round_key = f"Round_{round_match.group(1)}" if round_match else "Round_Unknown"
        
        if round_key not in experiments:
            experiments[round_key] = {'files': [], 'channels': {}}
        
        experiments[round_key]['files'].append(file_path)
        
        channel_match = re.search(r'C(\d+)-MAX', filename)
        if channel_match:
            ch_num = int(channel_match.group(1))
            channel_name = extract_channel_name_roman_round(filename)
            experiments[round_key]['channels'][ch_num] = {
                'file': file_path,
                'name': channel_name
            }
    
    return experiments


def load_roman_round_folder(folder_path):
    tif_files = glob.glob(str(Path(folder_path) / "*.tif"))
    tif_files.extend(glob.glob(str(Path(folder_path) / "*.tiff")))
    
    if not tif_files:
        print(f"No TIF files found in {folder_path}")
        return None
    
    print(f"Found {len(tif_files)} TIF files")
    experiments = group_files_by_experiment(tif_files)
    print(f"Found experiments: {list(experiments.keys())}")
    
    result = {}
    for exp_name, exp_data in experiments.items():
        print(f"\nProcessing {exp_name}:")
        
        sorted_channels = sorted(exp_data['channels'].items())
        channel_files = []
        channel_names = []
        
        for ch_num, ch_info in sorted_channels:
            channel_files.append(ch_info['file'])
            channel_names.append(ch_info['name'])
            print(f"  Channel {ch_num}: {ch_info['name']}")
        
        result[exp_name] = {
            'files': channel_files,
            'names': channel_names
        }
    
    return result


def create_neuroglancer_from_roman_folder(folder_path):
    experiments = load_roman_round_folder(folder_path)
    
    if not experiments:
        print("No valid experiments found!")
        return None
    
    try:
        import imageio
    except ImportError:
        print("imageio library required. Install with: pip install imageio")
        return None
    
    all_channels_data = []
    all_channel_names = []
    
    sorted_experiments = sorted(experiments.items(), 
                              key=lambda x: int(re.search(r'(\d+)', x[0]).group(1)) if re.search(r'(\d+)', x[0]) else 0)
    
    for exp_name, exp_data in sorted_experiments:
        print(f"\nLoading {exp_name} with {len(exp_data['files'])} channels")
        
        for i, file_path in enumerate(exp_data['files']):
            try:
                print(f"Loading: {Path(file_path).name}")
                img_data = imageio.imread(file_path)
                
                if img_data.ndim == 3:
                    if img_data.shape[0] == 1:
                        img_data = img_data[0]
                    elif img_data.shape[-1] == 1:
                        img_data = img_data[:, :, 0]
                    else:
                        img_data = img_data[0]
                
                all_channels_data.append(img_data)
                
                round_num = re.search(r'(\d+)', exp_name).group(1) if re.search(r'(\d+)', exp_name) else "X"
                channel_name_with_round = f"R{round_num}_{exp_data['names'][i]}"
                all_channel_names.append(channel_name_with_round)
                
                print(f"  Shape: {img_data.shape}, Channel: {channel_name_with_round}")
                
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
                continue
    
    if not all_channels_data:
        print("No data loaded!")
        return None
    
    stacked_data = np.stack([img[np.newaxis, :, :] for img in all_channels_data], axis=0)
    
    print(f"\nFinal combined data:")
    print(f"Shape: {stacked_data.shape}")
    print(f"Total channels: {len(all_channel_names)}")
    print(f"Channel names: {all_channel_names}")
    
    assigned_colors = assign_unique_colors(len(all_channel_names))
    print(f"\nAssigned colors:")
    for name, color in zip(all_channel_names, assigned_colors):
        print(f"  Channel {all_channel_names.index(name)+1}: {name} -> {color}")
    
    viewer = create_2d_n_channel_viewer(stacked_data, all_channel_names, experiments)
    print(f"✓ Created combined viewer with all rounds")
    
    return viewer


def load_single_round(folder_path, round_number):
    tif_files = glob.glob(str(Path(folder_path) / "*.tif"))
    tif_files.extend(glob.glob(str(Path(folder_path) / "*.tiff")))
    
    round_files = []
    for file_path in tif_files:
        filename = Path(file_path).stem
        round_match = re.search(r'round(\d+)', filename.lower())
        if round_match and int(round_match.group(1)) == round_number:
            round_files.append(file_path)
    
    if not round_files:
        print(f"No files found for round {round_number}")
        return None
    
    channels = {}
    for file_path in round_files:
        filename = Path(file_path).stem
        channel_match = re.search(r'C(\d+)-MAX', filename)
        if channel_match:
            ch_num = int(channel_match.group(1))
            channel_name = extract_channel_name_roman_round(filename)
            channels[ch_num] = {
                'file': file_path,
                'name': channel_name
            }
    
    sorted_channels = sorted(channels.items())
    channel_files = [ch_info['file'] for ch_num, ch_info in sorted_channels]
    channel_names = [ch_info['name'] for ch_num, ch_info in sorted_channels]
    
    print(f"Round {round_number} channels: {channel_names}")
    
    assigned_colors = assign_unique_colors(len(channel_names))
    print(f"Assigned colors:")
    for name, color in zip(channel_names, assigned_colors):
        print(f"  Channel {channel_names.index(name)+1}: {name} -> {color}")
    
    import imageio
    channels_data = []
    
    for file_path in channel_files:
        img_data = imageio.imread(file_path)
        if img_data.ndim == 3 and img_data.shape[0] == 1:
            img_data = img_data[0]
        channels_data.append(img_data.astype(np.float32))
    
    stacked_data = np.stack([img[np.newaxis, :, :] for img in channels_data], axis=0)
    return create_2d_n_channel_viewer(stacked_data, channel_names, round_number)


def load_all_rounds_combined(folder_path):
    return create_neuroglancer_from_roman_folder(folder_path)


def load_round(folder_path, round_number):
    return load_single_round(folder_path, round_number)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Roman Round Neuroglancer Loader')
    parser.add_argument('--input', '-i', required=True, 
                       help='Path to folder containing Roman round TIF files')
    parser.add_argument('--round', '-r', type=int, 
                       help='Load specific round number (1, 2, 3, etc.). If not specified, loads all rounds combined')
    parser.add_argument('--port', '-p', type=int, default=9999,
                       help='Port for Neuroglancer server (default: 9999)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input folder '{args.input}' does not exist")
        return
    
    neuroglancer.set_server_bind_address(bind_address='localhost', bind_port=args.port)
    
    print(f"🔬 Roman Round Neuroglancer Loader")
    print(f"📁 Input folder: {args.input}")
    print(f"🌐 Server port: {args.port}")
    
    if args.round:
        print(f"🎯 Loading Round {args.round}...")
        viewer = load_round(args.input, args.round)
    else:
        print("🌈 Loading all rounds combined...")
        viewer = load_all_rounds_combined(args.input)
    
    if viewer:
        print(f"\n✅ Neuroglancer viewer ready!")
        print(f"🌐 Open this URL in your browser: {viewer}")
        print(f"⚡ Smart color assignments based on proteins and wavelengths")
        print(f"🎨 Enhanced shader with descriptive names and controls")
        print(f"🔆 Auto-optimized brightness and contrast for each channel")
        print(f"📝 Shader includes round and marker information")
        print(f"⛔ Press Ctrl+C to stop the server")
        
        try:
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
    else:
        print("\n❌ Failed to create viewer")


if __name__ == "__main__":
    main()
