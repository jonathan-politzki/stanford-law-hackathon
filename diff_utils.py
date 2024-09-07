from diff_match_patch import diff_match_patch

def compare_texts(paragraphs1, paragraphs2):
    dmp = diff_match_patch()
    formatted_diffs = []

    for p1, p2 in zip(paragraphs1, paragraphs2):
        diffs = dmp.diff_main(p1['text'], p2['text'])
        dmp.diff_cleanupSemantic(diffs)
        
        for op, text in diffs:
            if op == 0:
                formatted_diffs.append(('unchanged', text, p1['style'], p1['indent']))
            elif op == 1:
                formatted_diffs.append(('added', text, p2['style'], p2['indent']))
            else:
                formatted_diffs.append(('removed', text, p1['style'], p1['indent']))
    
    return formatted_diffs

def identify_linked_edits(diffs, max_distance=2, context_size=3):
    linked_edits = []
    current_group = []
    last_edit_index = -1

    for i, (op, text, style, indent) in enumerate(diffs):
        if op in ['added', 'removed']:
            if not current_group or i - last_edit_index <= max_distance:
                # Check context similarity
                context_similar = check_context_similarity(diffs, i, last_edit_index, context_size)
                if context_similar or not current_group:
                    current_group.append((i, op, text, style, indent))
                else:
                    linked_edits.append(current_group)
                    current_group = [(i, op, text, style, indent)]
            else:
                linked_edits.append(current_group)
                current_group = [(i, op, text, style, indent)]
            last_edit_index = i
        elif current_group:
            linked_edits.append(current_group)
            current_group = []

    if current_group:
        linked_edits.append(current_group)

    return linked_edits

def check_context_similarity(diffs, current_index, last_index, context_size):
    if last_index == -1:
        return True
    
    current_context = get_context(diffs, current_index, context_size)
    last_context = get_context(diffs, last_index, context_size)
    
    return are_contexts_similar(current_context, last_context)

def get_context(diffs, index, size):
    start = max(0, index - size)
    end = min(len(diffs), index + size + 1)
    return diffs[start:end]

def are_contexts_similar(context1, context2):
    # Implement a basic similarity check
    text1 = ' '.join(item[1] for item in context1)
    text2 = ' '.join(item[1] for item in context2)
    return text1.lower() == text2.lower()
