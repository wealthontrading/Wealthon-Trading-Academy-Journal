import re

with open('src/components/AdminFeedbackAnalytics.tsx', 'r') as f:
    c = f.read()

# Add prop
interface_str = "export const AdminFeedbackAnalytics: React.FC = () => {"
new_interface = """interface AdminFeedbackAnalyticsProps {
  defaultTypeFilter?: string;
}

export const AdminFeedbackAnalytics: React.FC<AdminFeedbackAnalyticsProps> = ({ defaultTypeFilter = 'all' }) => {"""
c = c.replace(interface_str, new_interface)

# Modify typeFilter initialization
state_str = "const [typeFilter, setTypeFilter] = useState<string>('all');"
new_state = "const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);"
c = c.replace(state_str, new_state)

with open('src/components/AdminFeedbackAnalytics.tsx', 'w') as f:
    f.write(c)
