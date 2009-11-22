module JS
  class Build
    def self.build(input, output)
      File.open(output, 'w') do |fout|
        File.open(input, 'r') do |fin|
          fout << fin.readlines.join.gsub(/new CGD.Module.*\);/m, '')
        end
      end
    end
  end
end