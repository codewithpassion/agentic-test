#!/usr/bin/env python3
"""
Claude Code hook to automatically generate changelog entries when a git commit is made.
This hook intercepts Bash commands containing 'git commit' and adds a comprehensive
changelog entry to CHANGELOG.md based on the commit changes.
"""

import json
import sys
import subprocess
import re
from datetime import datetime
from pathlib import Path

def get_git_diff():
    """Get the staged changes that will be committed."""
    try:
        # Get diff of staged changes
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-status"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return ""

def get_detailed_diff():
    """Get detailed diff for analysis."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        return ""

def extract_commit_message(command):
    """Extract commit message from git commit command."""
    # First try to match heredoc format (Claude Code's format)
    heredoc_pattern = r'git commit -m "\$\(cat <<\'EOF\'\n(.*?)\nEOF'
    heredoc_match = re.search(heredoc_pattern, command, re.DOTALL)
    if heredoc_match:
        message = heredoc_match.group(1).strip()
        # Remove Claude Code signature and co-author lines
        message = re.sub(r'\n\n.*Generated with \[Claude Code\].*', '', message, flags=re.DOTALL)
        message = re.sub(r'\n\nCo-Authored-By:.*', '', message, flags=re.DOTALL)
        # Also remove any emoji lines
        message = re.sub(r'\n\n🤖.*', '', message, flags=re.DOTALL)
        return message.strip()
    
    # Try standard patterns
    patterns = [
        r'git commit -m ["\']([^"\']+)["\']',
        r'git commit --message[= ]["\']([^"\']+)["\']',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, command, re.DOTALL)
        if match:
            message = match.group(1).strip()
            return message
    
    return "Update"

def analyze_changes(diff_output, detailed_diff):
    """Analyze the git diff to understand what changed."""
    changes = {
        "added": [],
        "modified": [],
        "deleted": [],
        "renamed": []
    }
    
    for line in diff_output.split('\n'):
        if not line:
            continue
        
        parts = line.split('\t')
        if len(parts) < 2:
            continue
            
        status = parts[0]
        file_path = parts[1]
        
        if status == 'A':
            changes["added"].append(file_path)
        elif status == 'M':
            changes["modified"].append(file_path)
        elif status == 'D':
            changes["deleted"].append(file_path)
        elif status.startswith('R'):
            if len(parts) > 2:
                changes["renamed"].append(f"{file_path} → {parts[2]}")
            else:
                changes["renamed"].append(file_path)
    
    # Analyze specific changes more intelligently
    analysis = {
        "components": set(),
        "features": [],
        "technical": []
    }
    
    # Analyze file paths for context
    for file_list in [changes["added"], changes["modified"]]:
        for file_path in file_list:
            # Extract component/module names
            if '/components/' in file_path:
                component = file_path.split('/components/')[-1].split('/')[0]
                analysis["components"].add(f"{component} component")
            elif '/routes/' in file_path:
                route = file_path.split('/routes/')[-1].replace('.tsx', '').replace('.jsx', '')
                analysis["components"].add(f"{route} route")
            elif '/hooks/' in file_path:
                hook = file_path.split('/hooks/')[-1].replace('.ts', '').replace('.js', '')
                analysis["components"].add(f"{hook} hook")
            elif '/convex/' in file_path:
                analysis["technical"].append("Convex backend functions")
            elif 'schema' in file_path:
                analysis["technical"].append("Database schema")
    
    # Analyze detailed diff for specific patterns
    lines = detailed_diff.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('+') and not line.startswith('+++'):
            # Look for new functions/methods
            if re.match(r'\+\s*(export\s+)?(async\s+)?function\s+(\w+)', line):
                func_match = re.match(r'\+\s*(export\s+)?(async\s+)?function\s+(\w+)', line)
                if func_match:
                    analysis["features"].append(f"New function: {func_match.group(3)}")
            elif re.match(r'\+\s*(export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\(', line):
                const_match = re.match(r'\+\s*(export\s+)?const\s+(\w+)', line)
                if const_match:
                    analysis["features"].append(f"New function: {const_match.group(2)}")
            # Look for React components
            elif 'export default function' in line or 'export function' in line:
                comp_match = re.search(r'function\s+(\w+)', line)
                if comp_match:
                    analysis["components"].add(f"{comp_match.group(1)} component")
            # Look for API endpoints
            elif 'router.' in line or 'app.' in line:
                if 'get(' in line or 'post(' in line or 'put(' in line or 'delete(' in line:
                    analysis["features"].append("API endpoint changes")
    
    # Check for specific technology changes
    if 'convex' in detailed_diff.lower():
        analysis["technical"].append("Convex integration")
    if 'clerk' in detailed_diff.lower():
        analysis["technical"].append("Clerk authentication")
    if 'drizzle' in detailed_diff.lower():
        analysis["technical"].append("Drizzle ORM")
    if 'migration' in detailed_diff.lower():
        analysis["technical"].append("Database migrations")
    
    return changes, analysis

def generate_changelog_entry(commit_message, changes, analysis):
    """Generate a comprehensive changelog entry."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    entry = f"\n## [{timestamp}]\n\n"
    entry += f"### {commit_message}\n\n"
    
    # Generate intelligent summary based on analysis
    if analysis["components"] or analysis["features"] or analysis["technical"]:
        entry += "**Changes:**\n"
        
        # Add component changes
        if analysis["components"]:
            for component in sorted(analysis["components"]):
                entry += f"- Updated {component}\n"
        
        # Add feature changes
        if analysis["features"]:
            # Deduplicate and clean up features
            unique_features = list(set(analysis["features"]))
            for feature in unique_features[:5]:  # Limit to 5 most relevant
                entry += f"- {feature}\n"
        
        # Add technical changes
        if analysis["technical"]:
            unique_tech = list(set(analysis["technical"]))
            for tech in unique_tech:
                entry += f"- {tech} updates\n"
        
        entry += "\n"
    
    # Group files by category for better organization
    file_categories = {
        "Frontend Components": [],
        "Backend/API": [],
        "Database": [],
        "Configuration": [],
        "Documentation": [],
        "Tests": [],
        "Other": []
    }
    
    # Categorize added and modified files
    for file in changes["added"] + changes["modified"]:
        categorized = False
        
        if any(x in file for x in ['/components/', '/routes/', '/hooks/', '.tsx', '.jsx']):
            file_categories["Frontend Components"].append(file)
            categorized = True
        elif any(x in file for x in ['/api/', '/convex/', '/workers/', 'trpc']):
            file_categories["Backend/API"].append(file)
            categorized = True
        elif any(x in file for x in ['schema', 'migration', '.sql', 'database']):
            file_categories["Database"].append(file)
            categorized = True
        elif any(x in file for x in ['.json', '.config', '.env', 'wrangler', 'package']):
            file_categories["Configuration"].append(file)
            categorized = True
        elif any(x in file for x in ['.md', 'README', 'CHANGELOG', 'docs/']):
            file_categories["Documentation"].append(file)
            categorized = True
        elif any(x in file for x in ['test', 'spec', '__tests__']):
            file_categories["Tests"].append(file)
            categorized = True
        
        if not categorized:
            file_categories["Other"].append(file)
    
    # Add categorized file changes
    for category, files in file_categories.items():
        if files:
            entry += f"**{category}:**\n"
            for file in files[:10]:  # Limit to 10 files per category
                # Determine if file was added or modified
                action = "Added" if file in changes["added"] else "Modified"
                
                # Get descriptive name
                filename = file.split('/')[-1]
                path_context = '/'.join(file.split('/')[:-1]) if '/' in file else ''
                
                if path_context:
                    entry += f"- {action} `{filename}` in {path_context}\n"
                else:
                    entry += f"- {action} `{filename}`\n"
            
            if len(files) > 10:
                entry += f"- ...and {len(files) - 10} more files\n"
            entry += "\n"
    
    # Add deleted files if any
    if changes["deleted"]:
        entry += "**Removed:**\n"
        for file in changes["deleted"][:10]:
            filename = file.split('/')[-1]
            path_context = '/'.join(file.split('/')[:-1]) if '/' in file else ''
            
            if path_context:
                entry += f"- Removed `{filename}` from {path_context}\n"
            else:
                entry += f"- Removed `{filename}`\n"
        
        if len(changes["deleted"]) > 10:
            entry += f"- ...and {len(changes['deleted']) - 10} more files\n"
        entry += "\n"
    
    # Add renamed files if any
    if changes["renamed"]:
        entry += "**Renamed:**\n"
        for rename in changes["renamed"][:5]:
            entry += f"- {rename}\n"
        if len(changes["renamed"]) > 5:
            entry += f"- ...and {len(changes['renamed']) - 5} more files\n"
        entry += "\n"
    
    # Add technical details if relevant
    tech_details = []
    
    # Infer technical details from file changes
    if any('convex' in f.lower() for f in changes["added"] + changes["modified"]):
        tech_details.append("Convex real-time database integration")
    if any('clerk' in f.lower() for f in changes["added"] + changes["modified"]):
        tech_details.append("Clerk authentication system")
    if any('migration' in f.lower() for f in changes["deleted"]):
        tech_details.append("Removed database migrations (migrated to new system)")
    if any('.sql' in f for f in changes["deleted"]):
        tech_details.append("Removed SQL files")
    
    if tech_details:
        entry += "**Technical Details:**\n"
        for detail in tech_details:
            entry += f"- {detail}\n"
        entry += "\n"
    
    return entry

def update_changelog(entry):
    """Update the CHANGELOG.md file with the new entry."""
    changelog_path = Path("CHANGELOG.md")
    
    # Read existing content or create new
    if changelog_path.exists():
        with open(changelog_path, 'r') as f:
            content = f.read()
    else:
        content = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n"
    
    # Insert the new entry after the header
    lines = content.split('\n')
    insert_index = 0
    
    # Find where to insert (after the main header and description)
    for i, line in enumerate(lines):
        if line.startswith('##'):
            insert_index = i
            break
        elif i > 0 and not line.strip() and lines[i-1].strip():
            insert_index = i + 1
            break
    
    if insert_index == 0:
        insert_index = len(lines)
    
    # Insert the new entry
    lines.insert(insert_index, entry)
    
    # Write back
    with open(changelog_path, 'w') as f:
        f.write('\n'.join(lines))
    
    return changelog_path

def main():
    # Load input from stdin
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # Silent fail if not proper JSON
    
    # Check if this is a PreToolUse hook for Bash
    if input_data.get("hook_event_name") != "PreToolUse":
        sys.exit(0)
    
    if input_data.get("tool_name") != "Bash":
        sys.exit(0)
    
    # Get the command
    command = input_data.get("tool_input", {}).get("command", "")
    
    # Check if it's a git commit command
    if "git commit" not in command:
        sys.exit(0)  # Not a commit, let it proceed
    
    # Don't process if it's just checking status or --amend
    if "--amend" in command or "--dry-run" in command or "-n" in command:
        sys.exit(0)
    
    try:
        # Get the changes that will be committed
        diff_output = get_git_diff()
        detailed_diff = get_detailed_diff()
        
        if not diff_output:
            # No staged changes, let git handle the error
            sys.exit(0)
        
        # Extract commit message
        commit_message = extract_commit_message(command)
        
        # Analyze changes
        changes, analysis = analyze_changes(diff_output, detailed_diff)
        
        # Generate changelog entry
        entry = generate_changelog_entry(commit_message, changes, analysis)
        
        # Update changelog
        changelog_path = update_changelog(entry)
        
        # Output success message
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": f"Changelog entry added to {changelog_path}"
            },
            "systemMessage": f"✅ Changelog entry automatically added to {changelog_path}"
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        # On error, still allow the commit but notify
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": f"Changelog generation failed: {str(e)}"
            },
            "systemMessage": f"⚠️ Changelog generation failed: {str(e)}"
        }
        print(json.dumps(output))
    
    sys.exit(0)

if __name__ == "__main__":
    main()